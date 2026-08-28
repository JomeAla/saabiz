import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ValidateLicenseDto } from './dto/validate-license.dto';
import { HoneypotsService } from '../honeypots/honeypots.service';
import Redis from 'ioredis';

@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);
  private redis: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly honeypots: HoneypotsService,
  ) {
    this.initRedis();
  }

  private async initRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl);
      this.redis.on('error', (err) => {
        this.logger.warn(`Redis connection error: ${err.message}`);
        this.redis = null;
      });
      this.logger.log('Redis connected for license caching');
    } catch (error: any) {
      this.logger.warn(`Failed to connect to Redis: ${error.message}`);
    }
  }

  private getCacheKey(key: string, productId: string): string {
    return `license:${key}:${productId}`;
  }

  async validateLicense(dto: ValidateLicenseDto, ctx?: { ipAddress?: string; userAgent?: string }) {
    const { key, productId } = dto;

    // Honeypot: if this key is a decoy, record the hit and answer a plausible
    // "valid" response so the pirate stays engaged while we gather intel.
    const isDecoy = await this.honeypots.isDecoy(key, productId, {
      endpoint: 'verify',
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
    if (isDecoy) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { name: true },
      });
      return {
        valid: true,
        productName: product?.name || 'Software License',
        expiresAt: null,
      };
    }

    const cacheKey = this.getCacheKey(key, productId);

    if (this.redis) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          this.logger.debug(`License cache hit for ${key}`);
          return JSON.parse(cached);
        }
      } catch (error: any) {
        this.logger.warn(`Redis cache read error: ${error.message}`);
      }
    }

    const license = await this.prisma.license.findUnique({
      where: { key: key },
      include: { product: true }
    });

    if (!license) {
      throw new NotFoundException('License key not found');
    }

    if (license.productId !== productId) {
      throw new BadRequestException('License key does not apply to this product');
    }

    let result: any;
    if (!license.active) {
      result = {
        valid: false,
        reason: 'License is inactive or revoked',
      };
    } else if (license.expiresAt && license.expiresAt < new Date()) {
      result = {
        valid: false,
        reason: 'License has expired',
        expiredAt: license.expiresAt,
      };
    } else {
      result = {
        valid: true,
        productName: license.product.name,
        expiresAt: license.expiresAt,
      };
    }

    if (this.redis) {
      try {
        const ttl = license.active && (!license.expiresAt || license.expiresAt > new Date()) ? 300 : 60;
        await this.redis.setex(cacheKey, ttl, JSON.stringify(result));
        this.logger.debug(`License cached for ${key} (TTL: ${ttl}s)`);
      } catch (error: any) {
        this.logger.warn(`Redis cache write error: ${error.message}`);
      }
    }

    return result;
  }

  async getSubscribersBySeller(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller profile not found');

    const licenses = await this.prisma.license.findMany({
      where: {
        product: {
          sellerId: seller.id
        }
      },
      include: {
        product: {
          include: {
            plans: { select: { id: true, name: true, maxActivations: true, interval: true, price: true } },
          },
        },
        transaction: {
          include: {
            plan: true
          }
        }
      },
    });

    return licenses.map((l) => ({
      id: l.id,
      key: l.key,
      active: l.active,
      buyerEmail: l.buyerEmail,
      machineId: l.machineId,
      activations: l.activations,
      maxActivations: l.product.plans[0]?.maxActivations ?? 1,
      product: { id: l.product.id, name: l.product.name },
      transaction: l.transaction
        ? {
            reference: l.transaction.reference,
            amount: l.transaction.amount,
            gateway: l.transaction.gateway,
            plan: l.transaction.plan,
          }
        : null,
      expiresAt: l.expiresAt,
    }));
  }

  async revokeLicense(userId: string, licenseId: string, role?: string) {
    const license = await this.findLicensable(userId, licenseId, role);
    await this.prisma.license.update({
      where: { id: license.id },
      data: { active: false, machineId: null },
    });
    await this.prisma.auditLog.create({
      data: {
        action: 'LICENSE_REVOKE',
        resource: 'license',
        resourceId: license.key,
        details: { sellerId: license.product.sellerId },
      },
    });
    return { success: true, message: `License ${license.key} revoked` };
  }

  async reactivateLicense(userId: string, licenseId: string, role?: string) {
    const license = await this.findLicensable(userId, licenseId, role);
    await this.prisma.license.update({
      where: { id: license.id },
      data: { active: true },
    });
    return { success: true, message: `License ${license.key} reactivated` };
  }

  private async findLicensable(userId: string, licenseId: string, role?: string) {
    const where: any = { id: licenseId };
    if (role !== 'ADMIN') {
      where.product = { seller: { userId } };
    }
    const license = await this.prisma.license.findFirst({
      where,
      include: { product: { select: { id: true, name: true, sellerId: true } } },
    });
    if (!license) throw new NotFoundException('License not found for your products');
    return license;
  }
}
