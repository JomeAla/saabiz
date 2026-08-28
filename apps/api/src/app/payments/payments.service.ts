import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TenantService } from '../tenancy/tenant.service';
import { UpdatePaymentConfigDto } from './dto/payment-config.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService
  ) {}

  /**
   * Resolve the effective payment config for a tenant context:
   * tenant-scoped config if present, otherwise the platform-level config.
   */
  async getEffectiveConfig(tenantId?: string | null) {
    if (tenantId) {
      const tenantConfig = await this.prisma.platformConfig.findFirst({
        where: { tenantId },
      });
      if (tenantConfig) return tenantConfig;
    }
    const platformConfig = await this.prisma.platformConfig.findFirst({
      where: { tenantId: null },
    });
    if (platformConfig) return platformConfig;
    return this.prisma.platformConfig.findFirst();
  }

  async getPaymentConfig(tenantId?: string | null) {
    const config = tenantId
      ? await this.getEffectiveConfig(tenantId)
      : await this.prisma.platformConfig.findFirst({ where: { tenantId: null } })
        ?? await this.prisma.platformConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Platform payment configuration not found');
    }
    return config;
  }

  async updatePaymentConfig(dto: UpdatePaymentConfigDto, tenantId?: string | null) {
    const existingConfig = tenantId
      ? await this.prisma.platformConfig.findFirst({ where: { tenantId } })
      : await this.prisma.platformConfig.findFirst({ where: { tenantId: null } });

    if (existingConfig) {
      return this.prisma.platformConfig.update({
        where: { id: existingConfig.id },
        data: { ...dto, tenantId: tenantId ?? null },
      });
    }
    return this.prisma.platformConfig.create({
      data: { ...dto, tenantId: tenantId ?? null },
    });
  }

  currentTenantId(): string | null | undefined {
    return this.tenantService.scopeTenantId();
  }
}