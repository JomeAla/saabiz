import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ValidateLicenseDto } from './dto/validate-license.dto';
import Redis from 'ioredis';

@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);
  private redis: Redis | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.initRedis();
  }

  private async initRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
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

  async validateLicense(dto: ValidateLicenseDto) {
    const { key, productId } = dto;
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

    return this.prisma.license.findMany({
      where: {
        product: {
          sellerId: seller.id
        }
      },
      include: {
        product: true,
        transaction: {
          include: {
            plan: true
          }
        }
      }
    });
  }
}
