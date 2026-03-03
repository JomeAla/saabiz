import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdatePaymentConfigDto } from './dto/payment-config.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentConfig(sellerId: string) {
    const config = await this.prisma.paymentConfig.findUnique({
      where: { sellerId },
    });
    if (!config) {
      throw new NotFoundException('Payment configuration not found');
    }
    return config;
  }

  async updatePaymentConfig(sellerId: string, dto: UpdatePaymentConfigDto) {
    return this.prisma.paymentConfig.upsert({
      where: { sellerId },
      update: dto,
      create: {
        ...dto,
        sellerId,
      },
    });
  }
}
