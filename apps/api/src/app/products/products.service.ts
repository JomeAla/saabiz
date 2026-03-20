import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic() {
    return this.prisma.product.findMany({
      where: { isFrozen: false },
      include: {
        seller: { select: { businessName: true } },
        plans: true,
      },
    });
  }

  async findOnePublic(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: { select: { businessName: true } },
        plans: { orderBy: { price: 'asc' } },
      },
    });
    if (!product || product.isFrozen) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(userId: string, createProductDto: CreateProductDto) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        sellerId: seller.id,
      },
    });
  }

  async findAll(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    return this.prisma.product.findMany({ where: { sellerId: seller.id } });
  }

  async findOne(userId: string, id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.sellerId !== seller.id) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(userId: string, id: string, updateProductDto: UpdateProductDto) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.sellerId !== seller.id) {
      throw new NotFoundException('Product not found');
    }
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(userId: string, id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
      throw new NotFoundException('Seller not found');
    }
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.sellerId !== seller.id) {
      throw new NotFoundException('Product not found');
    }
    return this.prisma.product.delete({ where: { id } });
  }
}
