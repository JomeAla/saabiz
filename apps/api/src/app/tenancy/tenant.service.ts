import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { PrismaService } from '../prisma.service';
import { TenantContext, TenantWithRelations } from './tenant.types';

const CACHE_TTL_MS = 60_000;

@Injectable()
export class TenantService implements OnModuleDestroy {
  private readonly storage = new AsyncLocalStorage<TenantContext>();
  private readonly cache = new Map<string, { tenant: TenantWithRelations | null; at: number }>();
  private readonly cacheTimer: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {
    this.cacheTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache) {
        if (now - entry.at > CACHE_TTL_MS) this.cache.delete(key);
      }
    }, CACHE_TTL_MS * 2);
  }

  onModuleDestroy() {
    clearInterval(this.cacheTimer);
  }

  get platformHost(): string {
    return (process.env.PLATFORM_DOMAIN || 'saabiz.com').toLowerCase().replace(/^www\./, '');
  }

  normalizeHost(host: string): string | null {
    if (!host) return null;
    let h = host.toLowerCase().trim();
    const portIdx = h.lastIndexOf(':');
    if (portIdx > 0 && /^\d+$/.test(h.slice(portIdx + 1))) {
      h = h.slice(0, portIdx);
    }
    h = h.replace(/^www\./, '');
    return h || null;
  }

  isPlatformHost(host: string): boolean {
    const h = this.normalizeHost(host);
    if (!h) return false;
    const platform = this.platformHost;
    return h === platform || h === `www.${platform}` || h === 'localhost' || h === '127.0.0.1';
  }

  async resolveTenantByHost(host: string): Promise<TenantWithRelations | null> {
    const h = this.normalizeHost(host);
    if (!h) return null;

    const cached = this.cache.get(h);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.tenant;

    const domain = await this.prisma.domain.findUnique({
      where: { host: h },
      include: { tenant: { include: { domains: true, seller: true } } },
    });

    const tenant = domain?.tenant?.isActive ? domain.tenant : null;
    this.cache.set(h, { tenant, at: Date.now() });
    return tenant;
  }

  async buildContext(host: string): Promise<TenantContext> {
    const rawHost = (host || '').split(',')[0];
    const normalized = this.normalizeHost(rawHost) || '';

    if (this.isPlatformHost(normalized)) {
      return { host: normalized, isPlatform: true, tenant: null, tenantHost: null };
    }

    const tenant = await this.resolveTenantByHost(normalized);
    if (!tenant) {
      return { host: normalized, isPlatform: false, tenant: null, tenantHost: null };
    }

    const primary = tenant.domains.find((d) => d.isPrimary)?.host || normalized;
    return { host: normalized, isPlatform: false, tenant, tenantHost: primary };
  }

  async buildContextFromRequest(req: any): Promise<TenantContext> {
    const tenantIdHeader = req.headers['x-tenant-id'];

    if (tenantIdHeader === 'platform') {
      return { host: this.normalizeHost(req.headers['x-forwarded-host'] || req.headers.host || '') || '', isPlatform: true, tenant: null, tenantHost: null };
    }

    if (tenantIdHeader && tenantIdHeader !== 'undefined') {
      const cached = this.cache.get(`id:${tenantIdHeader}`);
      let tenant: TenantWithRelations | null = cached?.tenant ?? null;
      if (cached && Date.now() - cached.at >= CACHE_TTL_MS) tenant = null;
      if (!tenant) {
        tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantIdHeader },
          include: { domains: true, seller: true },
        });
        this.cache.set(`id:${tenantIdHeader}`, { tenant, at: Date.now() });
      }
      if (!tenant || !tenant.isActive) {
        return { host: '', isPlatform: false, tenant: null, tenantHost: null };
      }
      const primary = tenant.domains.find((d) => d.isPrimary)?.host || '';
      return { host: primary, isPlatform: false, tenant, tenantHost: primary };
    }

    return this.buildContext(req.headers['x-forwarded-host'] || req.headers.host || '');
  }

  async runForRequest(req: any, _res: any, next: () => void) {
    const ctx = await this.buildContextFromRequest(req);
    req.tenantContext = ctx;
    this.storage.run(ctx, () => next());
  }

  current(): TenantContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Returns the active tenant id for scoping queries:
   * - platform host (or no context) -> undefined (global scope)
   * - tenant host -> tenant id
   * - unknown non-platform host -> null (access denied for tenant-scoped routes)
   */
  scopeTenantId(): string | null | undefined {
    const ctx = this.current();
    if (!ctx || ctx.isPlatform) return undefined;
    return ctx.tenant ? ctx.tenant.id : null;
  }

  frontendUrl(ctx?: TenantContext): string {
    const fallback = process.env.FRONTEND_URL || 'http://localhost:3000';
    const c = ctx || this.current();
    if (c?.tenant && c.tenantHost) {
      const scheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      return `${scheme}://${c.tenantHost}`;
    }
    return fallback;
  }

  getKnownHosts(): string[] {
    return [...this.cache.keys()];
  }
}