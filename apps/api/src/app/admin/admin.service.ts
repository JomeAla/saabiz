import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FreezeProductDto, UpdatePayoutDto, CreateUserDto, UpdateUserDto, CreatePromotionDto, UpdatePromotionDto, UpgradeSubscriptionDto, CreateTenantDto, UpdateTenantDto, AddDomainDto } from './dto/admin.dto';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { TenantService } from '../tenancy/tenant.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
    private flutterwaveService: FlutterwaveService,
    private notificationsService: NotificationsService,
    private tenantService: TenantService,
    private webhooksService: WebhooksService,
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
        tenant: { select: { id: true, name: true, slug: true } },
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

  async refundTransaction(transactionId: string, reason?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status === 'refunded') {
      throw new BadRequestException('Transaction already refunded');
    }

    if (transaction.status !== 'success') {
      throw new BadRequestException('Can only refund successful transactions');
    }

    try {
      let refundResult;
      if (transaction.gateway === 'paystack') {
        refundResult = await this.paystackService.refund(transaction.reference);
      } else if (transaction.gateway === 'flutterwave') {
        refundResult = await this.flutterwaveService.refund(transaction.reference);
      } else {
        throw new BadRequestException('Unsupported payment gateway');
      }

      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'refunded' },
      });

      const license = await this.prisma.license.findFirst({
        where: { transactionId },
      });
      if (license) {
        await this.prisma.license.update({
          where: { id: license.id },
          data: { active: false },
        });
      }

      return { success: true,       refundId: refundResult?.id, reason };
    } catch (error: any) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  // ==================== USER MANAGEMENT ====================
  async getAllUsers(role?: Role) {
    const where = role ? { role } : {};
    
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        seller: {
          select: {
            id: true,
            businessName: true,
            totalEarnings: true,
            _count: { select: { products: true } }
          }
        },
        affiliate: {
          select: {
            id: true,
            affiliateCode: true,
            totalEarnings: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        seller: true,
        affiliate: true,
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role as Role;

    // Prepare base user data
    const userData: any = {
      email: dto.email,
      password: hashedPassword,
      role,
      isEmailVerified: dto.skipVerification || false,
    };

    // Add verification token if not skipping
    if (!dto.skipVerification) {
      userData.emailVerifyToken = crypto.randomBytes(32).toString('hex');
    }

    // Create related records based on role
    if (role === Role.SELLER) {
      userData.seller = {
        create: {
          businessName: dto.businessName || dto.email.split('@')[0],
        }
      };
    } else if (role === Role.AFFILIATE) {
      userData.affiliate = {
        create: {
          affiliateCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
        }
      };
    }

    const user = await this.prisma.user.create({
      data: userData,
      include: {
        seller: true,
        affiliate: true,
      }
    });

    // Send verification email if not skipping
    if (!dto.skipVerification) {
      const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${userData.emailVerifyToken}`;
      this.notificationsService.sendEmail({
        to: dto.email,
        subject: 'Welcome to SAABIZ - Verify Your Email',
        body: `Welcome! An account has been created for you. Click here to verify your email: ${verifyLink}\n\nYour temporary password is: ${dto.password}`
      }).catch(err => console.error('Failed to send verification email:', err));
    } else {
      // Send welcome email with credentials
      this.notificationsService.sendEmail({
        to: dto.email,
        subject: 'Welcome to SAABIZ - Account Created',
        body: `Welcome! An account has been created for you.\n\nEmail: ${dto.email}\nTemporary Password: ${dto.password}\n\nRole: ${role}\n\nPlease log in and change your password.`
      }).catch(err => console.error('Failed to send welcome email:', err));
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { seller: true }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (user.seller && dto.businessName !== undefined) {
      await this.prisma.seller.update({
        where: { id: user.seller.id },
        data: { businessName: dto.businessName }
      });
    }

    if (user.seller && (dto.payoutEmail !== undefined || dto.payoutGateway !== undefined)) {
      await this.prisma.seller.update({
        where: { id: user.seller.id },
        data: {
          ...(dto.payoutEmail && { payoutEmail: dto.payoutEmail }),
          ...(dto.payoutGateway && { payoutGateway: dto.payoutGateway }),
        }
      });
    }

    return this.getUserById(userId);
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        seller: { include: { products: true } },
        affiliate: true,
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if seller has products with transactions
    if (user.seller?.products?.length) {
      const productsWithTransactions = await this.prisma.product.findMany({
        where: { 
          sellerId: user.seller.id,
          transactions: { some: {} }
        }
      });

      if (productsWithTransactions.length > 0) {
        throw new BadRequestException('Cannot delete user with products that have transactions');
      }
    }

    await this.prisma.user.delete({
      where: { id: userId }
    });

    return { success: true, message: 'User deleted successfully' };
  }

  // ==================== PROMOTION MANAGEMENT ====================
  async getAllPromotions() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { transactions: true } },
      }
    });
  }

  async getPromotionById(promotionId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { product: true }
        }
      }
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return promotion;
  }

  async createPromotion(dto: CreatePromotionDto) {
    // Check if code already exists
    const existing = await this.prisma.promotion.findUnique({
      where: { code: dto.code.toUpperCase() }
    });

    if (existing) {
      throw new ConflictException('Promotion code already exists');
    }

    return this.prisma.promotion.create({
      data: {
        code: dto.code.toUpperCase(),
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        startDate: dto.startDate,
        endDate: dto.endDate,
        isActive: dto.isActive ?? true,
        maxUses: dto.maxUses,
      }
    });
  }

  async updatePromotion(promotionId: string, dto: UpdatePromotionDto) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId }
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.maxUses !== undefined && { maxUses: dto.maxUses }),
      }
    });
  }

  async deletePromotion(promotionId: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id: promotionId },
      include: { _count: { select: { transactions: true } } }
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    if (promotion._count.transactions > 0) {
      throw new BadRequestException('Cannot delete promotion that has been used in transactions');
    }

    await this.prisma.promotion.delete({
      where: { id: promotionId }
    });

    return { success: true, message: 'Promotion deleted successfully' };
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================
  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        plan: true,
        licenses: { take: 1 },
        _count: { select: { transactions: true } }
      }
    });
  }

  async upgradeSubscription(dto: UpgradeSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
      include: { plan: true, product: true }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newPlan = await this.prisma.plan.findUnique({
      where: { id: dto.newPlanId }
    });

    if (!newPlan) {
      throw new NotFoundException('New plan not found');
    }

    if (newPlan.productId !== subscription.productId) {
      throw new BadRequestException('New plan must belong to the same product');
    }

    // Calculate new period end
    const now = new Date();
    let newPeriodEnd = subscription.currentPeriodEnd;
    
    if (newPlan.interval === 'MONTHLY') {
      newPeriodEnd = new Date(now.setMonth(now.getMonth() + 1));
    } else if (newPlan.interval === 'ANNUAL') {
      newPeriodEnd = new Date(now.setFullYear(now.getFullYear() + 1));
    }

    // Update subscription
    const updated = await this.prisma.subscription.update({
      where: { id: dto.subscriptionId },
      data: {
        planId: dto.newPlanId,
        currentPeriodEnd: newPeriodEnd,
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
      },
      include: {
        product: true,
        plan: true,
      }
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_UPGRADE',
        resource: 'Subscription',
        resourceId: dto.subscriptionId,
        details: {
          previousPlan: subscription.plan.name,
          newPlan: newPlan.name,
          reason: dto.reason,
        }
      }
    });

    return {
      success: true,
      message: 'Subscription upgraded successfully',
      subscription: updated
    };
  }

  async cancelSubscription(subscriptionId: string, reason?: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      }
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'SUBSCRIPTION_CANCEL',
        resource: 'Subscription',
        resourceId: subscriptionId,
        details: { reason }
      }
    });

    return {
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: updated
    };
  }

  // ==================== TENANT MANAGEMENT ====================

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        domains: true,
        seller: {
          include: {
            user: { select: { email: true } },
            _count: { select: { products: true } },
          },
        },
        configs: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        domains: true,
        seller: {
          include: {
            user: { select: { email: true } },
            _count: { select: { products: true } },
          },
        },
        configs: true,
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async createTenant(dto: CreateTenantDto) {
    const slug = dto.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Tenant slug already exists');

    const primaryHost = dto.primaryDomain ? this.tenantService.normalizeHost(dto.primaryDomain) : null;

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name.trim(),
        slug,
        settings: (dto.settings as any) || undefined,
        domains: primaryHost
          ? {
              create: { host: primaryHost, isPrimary: true, isVerified: true },
            }
          : undefined,
      },
      include: { domains: true },
    });

    if (dto.assignSellerId) {
      const seller = await this.prisma.seller.findUnique({ where: { id: dto.assignSellerId } });
      if (seller && !seller.tenantId) {
        await this.prisma.seller.update({
          where: { id: seller.id },
          data: { tenantId: tenant.id },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'TENANT_CREATE',
        resource: 'tenant',
        resourceId: tenant.id,
        details: { slug, primaryDomain: primaryHost },
      },
    });

    return this.getTenantById(tenant.id);
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    await this.getTenantById(id);
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.slug !== undefined) data.slug = dto.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.settings !== undefined) data.settings = dto.settings as any;

    return this.prisma.tenant.update({ where: { id }, data, include: { domains: true } });
  }

  async deactivateTenant(id: string) {
    await this.getTenantById(id);
    await this.prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, message: 'Tenant deactivated (storefront domains now 404)' };
  }

  async addTenantDomain(tenantId: string, dto: AddDomainDto) {
    await this.getTenantById(tenantId);
    const host = this.tenantService.normalizeHost(dto.host);
    if (!host) throw new BadRequestException('Invalid domain host');

    const existing = await this.prisma.domain.findUnique({ where: { host } });
    if (existing) throw new ConflictException('Domain already assigned to a tenant');

    const domain = await this.prisma.domain.create({
      data: { host, tenantId, isVerified: true, isPrimary: dto.isPrimary === true },
    });

    if (dto.isPrimary) {
      await this.prisma.domain.updateMany({
        where: { tenantId, id: { not: domain.id } },
        data: { isPrimary: false },
      });
    }

    return domain;
  }

  async removeTenantDomain(tenantId: string, domainId: string) {
    const domain = await this.prisma.domain.findFirst({ where: { id: domainId, tenantId } });
    if (!domain) throw new NotFoundException('Domain not found for tenant');
    await this.prisma.domain.delete({ where: { id: domainId } });
    return { success: true, message: `Domain ${domain.host} removed` };
  }

  async setTenantPrimaryDomain(tenantId: string, domainId: string) {
    const domain = await this.prisma.domain.findFirst({ where: { id: domainId, tenantId } });
    if (!domain) throw new NotFoundException('Domain not found for tenant');
    await this.prisma.$transaction([
      this.prisma.domain.updateMany({
        where: { tenantId },
        data: { isPrimary: false },
      }),
      this.prisma.domain.update({
        where: { id: domainId },
        data: { isPrimary: true },
      }),
    ]);
    return { success: true, message: `Primary domain set to ${domain.host}` };
  }

  async getTenantAnalytics(tenantId: string) {
    await this.getTenantById(tenantId);
    const [
      revenueAgg,
      transactionCount,
      activeSubscriptions,
      productCount,
      licenseCount,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { amount: true, sellerEarnings: true },
        where: { status: 'success', product: { seller: { tenantId } } },
      }),
      this.prisma.transaction.count({ where: { product: { seller: { tenantId } } } }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE', product: { seller: { tenantId } } },
      }),
      this.prisma.product.count({ where: { seller: { tenantId } } }),
      this.prisma.license.count({ where: { product: { seller: { tenantId } } } }),
      this.prisma.transaction.findMany({
        where: { product: { seller: { tenantId } } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { product: true, plan: true },
      }),
    ]);

    return {
      tenantId,
      totalRevenue: revenueAgg._sum.amount || 0,
      totalSellerEarnings: revenueAgg._sum.sellerEarnings || 0,
      totalTransactions: transactionCount,
      activeSubscriptions,
      productCount,
      licenseCount,
      recentTransactions,
    };
  }

  // ==================== WEBHOOK LOG & REPLAY ====================

  async listWebhookEvents(gateway?: string, status?: string, limit?: number) {
    return this.webhooksService.listEvents({ gateway, status, limit });
  }

  async replayWebhookEvent(id: string) {
    return this.webhooksService.replayEvent(id);
  }
}
