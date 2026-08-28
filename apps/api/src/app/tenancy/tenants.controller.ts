import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService
  ) {}

  @Get('resolve')
  async resolve(@Query('host') host?: string) {
    const h = this.tenantService.normalizeHost(host || '');
    if (!h || this.tenantService.isPlatformHost(h)) {
      return { isPlatform: true, tenantId: 'platform' };
    }
    const tenant = await this.tenantService.resolveTenantByHost(h);
    if (!tenant) {
      throw new NotFoundException('Unknown storefront domain');
    }
    return {
      isPlatform: false,
      tenantId: tenant.id,
      tenant: this.toPublic(tenant),
    };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { domains: true },
    });
    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Tenant not found');
    }
    return this.toPublic(tenant);
  }

  private toPublic(tenant: { id: string; name: string; slug: string; settings: unknown; domains?: { host: string; isPrimary: boolean }[] }) {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      settings: tenant.settings,
      primaryDomain: tenant.domains?.find((d) => d.isPrimary)?.host || null,
    };
  }
}