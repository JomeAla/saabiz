import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FreezeProductDto, UpdatePayoutDto } from './dto/admin.dto';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
    private flutterwaveService: FlutterwaveService,
  ) {}

  async getDashboardStats() {
    const [
      totalRevenue,
      totalTransactions,
      activeSubscriptions,
      totalSellers,
      totalProducts,
      revenueByGateway,
      recentTransactions,
      topSellingProducts,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'success' },
      }),
      this.prisma.transaction.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.seller.count(),
      this.prisma.product.count(),
      this.prisma.transaction.groupBy({
        by: ['gateway'],
        _sum: { amount: true },
        where: { status: 'success' },
      }),
      this.prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { product: true, plan: true },
      }),
      this.prisma.product.findMany({
        take: 5,
        include: {
          _count: { select: { transactions: true } },
          seller: { include: { user: true } },
        },
        orderBy: { transactions: { _count: 'desc' } },
      }),
    ]);

    const platformRevenue = totalRevenue._sum.amount || 0;
    const totalSellerEarnings = await this.prisma.transaction.aggregate({
      _sum: { sellerEarnings: true },
      where: { status: 'success' },
    });

    return {
      totalRevenue: platformRevenue,
      totalSellerEarnings: totalSellerEarnings._sum.sellerEarnings || 0,
      netPlatformRevenue: platformRevenue - (totalSellerEarnings._sum.sellerEarnings || 0),
      totalTransactions,
      activeSubscriptions,
      totalSellers,
      totalProducts,
      revenueByGateway: revenueByGateway.map(g => ({
        gateway: g.gateway,
        revenue: g._sum.amount || 0,
      })),
      recentTransactions,
      topSellingProducts,
    };
  }

  async getGMVByGateway() {
    return this.prisma.transaction.groupBy({
      by: ['gateway', 'status'],
      _count: true,
      _sum: { amount: true },
    });
  }

  async getAllSellers() {
    return this.prisma.seller.findMany({
      include: {
        user: { select: { id: true, email: true, role: true } },
        _count: { select: { products: true } },
        products: {
          include: {
            _count: { select: { transactions: true } },
            transactions: { where: { status: 'success' }, select: { amount: true, sellerEarnings: true } },
          },
        },
      },
    });
  }

  async freezeProduct(dto: FreezeProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id: dto.productId },
      data: {
        isFrozen: dto.freeze,
        freezeReason: dto.reason || null,
      },
    });
  }

  async getSellerPayouts(sellerId?: string) {
    const where = sellerId ? { id: sellerId } : {};
    
    const sellers = await this.prisma.seller.findMany({
      where,
      include: {
        user: { select: { email: true } },
        products: {
          include: {
            transactions: { where: { status: 'success' }, select: { amount: true, sellerEarnings: true } },
          },
        },
      },
    });

    return sellers.map(seller => {
      const totalEarnings = seller.products.flatMap(p => 
        p.transactions
      ).reduce((sum, t) => sum + (t.sellerEarnings || 0), 0);

      return {
        sellerId: seller.id,
        businessName: seller.businessName,
        email: seller.user.email,
        payoutGateway: seller.payoutGateway,
        payoutEmail: seller.payoutEmail,
        totalEarnings,
        pendingPayout: seller.pendingPayout,
        availableForPayout: totalEarnings - seller.pendingPayout,
      };
    });
  }

  async processPayout(dto: UpdatePayoutDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: dto.sellerId },
      include: { 
        user: true,
        products: {
          include: {
            transactions: { where: { status: 'success' }, select: { amount: true, sellerEarnings: true } },
          },
        },
      },
    });

    if (!seller) {
      throw new NotFoundException('Seller not found');
    }

    if (!seller.payoutEmail || !seller.payoutGateway) {
      throw new BadRequestException('Seller payout details not configured');
    }

    const totalEarnings = seller.products.flatMap(p => 
      p.transactions
    ).reduce((sum, t) => sum + (t.sellerEarnings || 0), 0);

    const availableForPayout = totalEarnings - seller.pendingPayout;

    if (dto.amount > availableForPayout) {
      throw new BadRequestException('Payout amount exceeds available balance');
    }

    if (dto.action === 'approve') {
      await this.prisma.seller.update({
        where: { id: dto.sellerId },
        data: { pendingPayout: seller.pendingPayout + dto.amount },
      });
      return { success: true, message: `Payout of $${dto.amount} approved` };
    } 
    
    if (dto.action === 'process') {
      try {
        let payoutResult;
        
        if (seller.payoutGateway === 'paystack') {
          payoutResult = await this.paystackService.initiateTransfer(
            dto.amount,
            seller.payoutEmail,
            `Payout for seller ${seller.businessName || seller.user.email}`
          );
        } else if (seller.payoutGateway === 'flutterwave') {
          payoutResult = await this.flutterwaveService.initiateTransfer(
            seller.payoutEmail,
            '044',
            dto.amount,
            seller.businessName || seller.user.email,
            `payout_${Date.now()}`
          );
        } else {
          throw new BadRequestException('Unsupported payout gateway');
        }

        await this.prisma.seller.update({
          where: { id: dto.sellerId },
          data: { pendingPayout: Math.max(0, seller.pendingPayout - dto.amount) },
        });

        return { 
          success: true, 
          message: `Payout of $${dto.amount} processed successfully`,
          reference: payoutResult?.data?.reference || payoutResult?.data?.transfer_code 
        };
      } catch (error: any) {
        throw new BadRequestException(`Payout failed: ${error.message}`);
      }
    }

    if (dto.action === 'reject') {
      await this.prisma.seller.update({
        where: { id: dto.sellerId },
        data: { pendingPayout: Math.max(0, seller.pendingPayout - dto.amount) },
      });
      return { success: true, message: `Payout of $${dto.amount} rejected` };
    }

    return { success: true, message: `Payout ${dto.action}ed successfully` };
  }

  async getAllProducts() {
    return this.prisma.product.findMany({
      include: {
        seller: { include: { user: { select: { email: true } } } },
        plans: true,
        _count: { select: { licenses: true, transactions: true } },
      },
    });
  }

  async getTransactions(filters: { gateway?: string; status?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    
    if (filters.gateway) where.gateway = filters.gateway;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return this.prisma.transaction.findMany({
      where,
      include: { product: true, plan: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
