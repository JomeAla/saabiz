import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_DOMAIN = (process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || process.env.PLATFORM_DOMAIN || 'saabiz.com').toLowerCase();
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const tenantCache = new Map<string, { tenantId: string; at: number }>();
const CACHE_TTL = 60_000;

function normalizeHost(host: string): string {
  let h = (host || '').toLowerCase().trim().split(',')[0];
  const portIdx = h.lastIndexOf(':');
  if (portIdx > 0 && /^\d+$/.test(h.slice(portIdx + 1))) {
    h = h.slice(0, portIdx);
  }
  return h.replace(/^www\./, '');
}

async function resolveTenantId(host: string): Promise<string | null> {
  const h = normalizeHost(host);
  if (!h) return null;
  if (h === PLATFORM_DOMAIN || h === `www.${PLATFORM_DOMAIN}` || h === 'localhost' || h === '127.0.0.1') {
    return null;
  }
  const cached = tenantCache.get(h);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.tenantId;
  try {
    const res = await fetch(`${API_URL}/api/tenants/resolve?host=${encodeURIComponent(h)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.tenantId && data.tenantId !== 'platform') {
        tenantCache.set(h, { tenantId: data.tenantId, at: Date.now() });
        return data.tenantId;
      }
    }
  } catch {
    /* API unreachable - fall through to platform context */
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const tenantId = await resolveTenantId(host);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-id', tenantId || 'platform');

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|js/|images/).*)'],
};