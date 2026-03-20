import { Controller, Get, Post, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SELLER)
export class SellerController {
  constructor(private prisma: PrismaService) {}

  @Get('settings')
  async getSettings(@Request() req: any) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: req.user.userId },
    });

    if (!seller) {
      return { error: 'Seller not found' };
    }

    return {
      businessName: seller.businessName,
      payoutEmail: seller.payoutEmail,
      payoutGateway: seller.payoutGateway,
    };
  }

  @Patch('settings')
  async updateSettings(@Request() req: any, @Body() body: { businessName?: string; payoutEmail?: string; payoutGateway?: string }) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: req.user.userId },
    });

    if (!seller) {
      return { error: 'Seller not found' };
    }

    const updated = await this.prisma.seller.update({
      where: { id: seller.id },
      data: {
        businessName: body.businessName,
        payoutEmail: body.payoutEmail,
        payoutGateway: body.payoutGateway,
      },
    });

    return {
      businessName: updated.businessName,
      payoutEmail: updated.payoutEmail,
      payoutGateway: updated.payoutGateway,
    };
  }

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: req.user.userId },
    });

    if (!seller) {
      return { error: 'Seller not found' };
    }

    const [
      totalProducts,
      activeProducts,
      totalTransactions,
      successfulTransactions,
      totalRevenue,
      recentTransactions,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.product.count({ where: { sellerId: seller.id } }),
      this.prisma.product.count({ where: { sellerId: seller.id, isFrozen: false } }),
      this.prisma.transaction.count({ where: { product: { sellerId: seller.id } } }),
      this.prisma.transaction.count({ where: { product: { sellerId: seller.id }, status: 'success' } }),
      this.prisma.transaction.aggregate({
        _sum: { sellerEarnings: true },
        where: { product: { sellerId: seller.id }, status: 'success' },
      }),
      this.prisma.transaction.findMany({
        where: { product: { sellerId: seller.id } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { product: true, plan: true },
      }),
      this.prisma.subscription.count({
        where: { product: { sellerId: seller.id }, status: 'ACTIVE' },
      }),
    ]);

    return {
      sellerId: seller.id,
      businessName: seller.businessName,
      totalEarnings: totalRevenue._sum.sellerEarnings || 0,
      pendingPayout: seller.pendingPayout,
      totalProducts,
      activeProducts,
      totalTransactions,
      successfulTransactions,
      activeSubscriptions,
      recentTransactions,
    };
  }

  @Get('analytics')
  async getAnalytics(@Request() req: any) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: req.user.userId },
    });

    if (!seller) {
      return { error: 'Seller not found' };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      totalTransactions,
      monthlyTransactions,
      activeSubscriptions,
      canceledSubscriptions,
      totalCustomers,
      products,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { sellerEarnings: true },
        _count: true,
        where: { product: { sellerId: seller.id }, status: 'success' },
      }),
      this.prisma.transaction.aggregate({
        _sum: { sellerEarnings: true },
        _count: true,
        where: { product: { sellerId: seller.id }, status: 'success', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.transaction.aggregate({
        _sum: { sellerEarnings: true },
        _count: true,
        where: { product: { sellerId: seller.id }, status: 'success', createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.transaction.count({ where: { product: { sellerId: seller.id } } }),
      this.prisma.transaction.count({ where: { product: { sellerId: seller.id }, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.subscription.count({ where: { product: { sellerId: seller.id }, status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { product: { sellerId: seller.id }, status: 'CANCELED' } }),
      this.prisma.transaction.groupBy({
        by: ['buyerEmail'],
        where: { product: { sellerId: seller.id }, status: 'success' },
        _count: true,
      }),
      this.prisma.product.findMany({
        where: { sellerId: seller.id },
        include: {
          _count: { select: { subscriptions: true, licenses: true, transactions: true } },
          subscriptions: { where: { status: 'ACTIVE' } },
          plans: true,
        },
      }),
    ]);

    const mrr = activeSubscriptions * 29.99;
    const ltv = totalRevenue._sum.sellerEarnings 
      ? (totalRevenue._sum.sellerEarnings / totalCustomers.length) 
      : 0;
    const churnRate = (activeSubscriptions + canceledSubscriptions) > 0 
      ? (canceledSubscriptions / (activeSubscriptions + canceledSubscriptions)) * 100 
      : 0;

    const productAnalytics = products.map(p => ({
      id: p.id,
      name: p.name,
      totalSales: p._count.transactions,
      activeSubscriptions: p.subscriptions.length,
      revenue: p._count.transactions * (p.plans[0]?.price || 0),
    }));

    const revenueByDay = await this.getRevenueByDay(seller.id, thirtyDaysAgo);
    const revenueByProduct = await this.getRevenueByProduct(seller.id);

    return {
      overview: {
        totalRevenue: totalRevenue._sum.sellerEarnings || 0,
        monthlyRevenue: monthlyRevenue._sum.sellerEarnings || 0,
        weeklyRevenue: weeklyRevenue._sum.sellerEarnings || 0,
        totalTransactions,
        monthlyTransactions,
        activeSubscriptions,
        canceledSubscriptions,
        totalCustomers: totalCustomers.length,
      },
      metrics: {
        mrr: Math.round(mrr * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
        churnRate: Math.round(churnRate * 100) / 100,
        avgOrderValue: totalRevenue._count > 0 
          ? Math.round((totalRevenue._sum.sellerEarnings || 0) / totalRevenue._count * 100) / 100 
          : 0,
      },
      products: productAnalytics,
      charts: {
        revenueByDay,
        revenueByProduct,
        subscriptionStatus: {
          active: activeSubscriptions,
          canceled: canceledSubscriptions,
        },
      },
    };
  }

  private async getRevenueByDay(sellerId: string, startDate: Date) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        product: { sellerId },
        status: 'success',
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        sellerEarnings: true,
        createdAt: true,
      },
    });

    const dailyRevenue: Record<string, { date: string; revenue: number; earnings: number }> = {};
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyRevenue[dateStr] = { date: dateStr, revenue: 0, earnings: 0 };
    }

    for (const tx of transactions) {
      const dateStr = tx.createdAt.toISOString().split('T')[0];
      if (dailyRevenue[dateStr]) {
        dailyRevenue[dateStr].revenue += tx.amount;
        dailyRevenue[dateStr].earnings += tx.sellerEarnings;
      }
    }

    return Object.values(dailyRevenue).reverse();
  }

  private async getRevenueByProduct(sellerId: string) {
    const products = await this.prisma.product.findMany({
      where: { sellerId },
      include: {
        transactions: {
          where: { status: 'success' },
          select: { amount: true, sellerEarnings: true },
        },
      },
    });

    return products.map(p => ({
      name: p.name,
      revenue: p.transactions.reduce((sum, t) => sum + t.amount, 0),
      earnings: p.transactions.reduce((sum, t) => sum + t.sellerEarnings, 0),
      count: p.transactions.length,
    }));
  }
}
