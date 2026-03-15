import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ValidateLicenseDto } from './dto/validate-license.dto';

@Injectable()
export class LicensesService {
  constructor(private readonly prisma: PrismaService) {}

  async validateLicense(dto: ValidateLicenseDto) {
    const { key, productId } = dto;

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

    if (!license.active) {
      return {
        valid: false,
        reason: 'License is inactive or revoked',
      };
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      return {
        valid: false,
        reason: 'License has expired',
        expiredAt: license.expiresAt,
      };
    }

    return {
      valid: true,
      productName: license.product.name,
      expiresAt: license.expiresAt,
    };
  }
}
