import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAffiliateLinkDto, UpdateAffiliateProfileDto } from './dto/affiliate.dto';

@Injectable()
export class AffiliatesService {
  constructor(private prisma: PrismaService) {}

  async getAffiliateProfile(userId: string) {
    let affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
      include: {
        links: {
          include: {
            product: {
              include: {
                seller: { include: { user: { select: { email: true } } } }
              }
            }
          }
        },
        commissions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { product: true }
        },
        _count: { select: { links: true, commissions: true } }
      },
    });

    if (!affiliate) {
      const code = this.generateAffiliateCode();
      affiliate = await this.prisma.affiliate.create({
        data: {
          userId,
          affiliateCode: code,
        },
        include: {
          links: true,
          commissions: true,
        },
      });
    }

    return affiliate;
  }

  async createAffiliateLink(userId: string, dto: CreateAffiliateLinkDto) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate profile not found');
    }

    const existingLink = await this.prisma.affiliateLink.findFirst({
      where: {
        affiliateId: affiliate.id,
        productId: dto.productId,
      },
    });

    if (existingLink) {
      return existingLink;
    }

    const code = `${affiliate.affiliateCode}-${dto.productId.slice(0, 8)}`;

    return this.prisma.affiliateLink.create({
      data: {
        affiliateId: affiliate.id,
        productId: dto.productId,
        code,
      },
      include: { product: true },
    });
  }

  async getMyLinks(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      return [];
    }

    return this.prisma.affiliateLink.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        product: true,
        _count: { select: { clicks: true, conversions: true } }
      },
    });
  }

  async getMyCommissions(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      return [];
    }

    return this.prisma.affiliateCommission.findMany({
      where: { affiliateId: affiliate.id },
      include: { product: true, transaction: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyPayouts(userId: string) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      return [];
    }

    return this.prisma.affiliatePayout.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAffiliateProfile(userId: string, dto: UpdateAffiliateProfileDto) {
    const affiliate = await this.prisma.affiliate.findUnique({
      where: { userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate profile not found');
    }

    return this.prisma.affiliate.update({
      where: { id: affiliate.id },
      data: {
        commissionRate: dto.commissionRate ?? affiliate.commissionRate,
      },
    });
  }

  async trackClick(code: string) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { code },
    });

    if (!link || !link.isActive) {
      return null;
    }

    await this.prisma.affiliateLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    });

    return link;
  }

  async trackConversion(code: string, productId: string, transactionId: string) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { code },
    });

    if (!link || !link.isActive) {
      return null;
    }

    const affiliate = await this.prisma.affiliate.findUnique({
      where: { id: link.affiliateId },
    });

    if (!affiliate) {
      return null;
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { product: true }
    });

    if (!transaction) {
      return null;
    }

    const commissionAmount = transaction.amount * affiliate.commissionRate;

    await this.prisma.$transaction([
      this.prisma.affiliateLink.update({
        where: { id: link.id },
        data: { conversions: { increment: 1 } },
      }),
      this.prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          totalReferrals: { increment: 1 },
          totalCommission: { increment: commissionAmount },
        },
      }),
      this.prisma.affiliateCommission.create({
        data: {
          affiliateId: affiliate.id,
          transactionId,
          productId,
          amount: commissionAmount,
          status: 'PENDING',
        },
      }),
    ]);

    return { success: true, commission: commissionAmount };
  }

  async getAffiliateByCode(code: string) {
    return this.prisma.affiliate.findUnique({
      where: { affiliateCode: code },
    });
  }

  async getAllAffiliates() {
    return this.prisma.affiliate.findMany({
      include: {
        user: { select: { email: true } },
        _count: { select: { links: true, commissions: true } }
      },
      orderBy: { totalCommission: 'desc' },
    });
  }

  async getAllCommissions() {
    return this.prisma.affiliateCommission.findMany({
      include: {
        affiliate: { include: { user: { select: { email: true } } } },
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateAffiliateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SAABIZ-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
