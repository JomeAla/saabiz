import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPlanDto: CreatePlanDto) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller not found');

    const product = await this.prisma.product.findUnique({ where: { id: createPlanDto.productId } });
    if (!product || product.sellerId !== seller.id) {
      throw new UnauthorizedException('Product does not belong to you or does not exist');
    }

    return this.prisma.plan.create({
      data: {
        name: createPlanDto.name,
        price: createPlanDto.price,
        interval: createPlanDto.interval,
        productId: createPlanDto.productId,
      },
    });
  }

  async findAllForProduct(userId: string, productId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller not found');

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.sellerId !== seller.id) {
      throw new UnauthorizedException('Product does not belong to you or does not exist');
    }

    return this.prisma.plan.findMany({ where: { productId } });
  }

  async findOne(userId: string, id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller not found');

    const plan = await this.prisma.plan.findUnique({ where: { id }, include: { product: true } });
    if (!plan || plan.product.sellerId !== seller.id) {
      throw new NotFoundException('Plan not found or unauthorized');
    }

    return plan;
  }

  async update(userId: string, id: string, updatePlanDto: UpdatePlanDto) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller not found');

    const plan = await this.prisma.plan.findUnique({ where: { id }, include: { product: true } });
    if (!plan || plan.product.sellerId !== seller.id) {
      throw new NotFoundException('Plan not found or unauthorized');
    }

    return this.prisma.plan.update({
      where: { id },
      data: updatePlanDto,
    });
  }

  async remove(userId: string, id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller not found');

    const plan = await this.prisma.plan.findUnique({ where: { id }, include: { product: true } });
    if (!plan || plan.product.sellerId !== seller.id) {
      throw new NotFoundException('Plan not found or unauthorized');
    }

    return this.prisma.plan.delete({ where: { id } });
  }
}
