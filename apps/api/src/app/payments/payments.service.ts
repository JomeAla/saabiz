import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdatePaymentConfigDto } from './dto/payment-config.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentConfig() {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Platform payment configuration not found');
    }
    return config;
  }

  async updatePaymentConfig(dto: UpdatePaymentConfigDto) {
    const existingConfig = await this.prisma.platformConfig.findFirst();
    if (existingConfig) {
      return this.prisma.platformConfig.update({
        where: { id: existingConfig.id },
        data: dto,
      });
    } else {
      return this.prisma.platformConfig.create({ data: dto });
    }
  }
}
