import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleDunning() {
    this.logger.log('Running daily dunning check...');
    
    const result = await this.processExpiredGracePeriods();
    this.logger.log(`Dunning complete: ${result.processed} subscriptions cancelled`);

    const escalated = await this.processDunningEmails();
    this.logger.log(`Dunning emails sent: ${escalated.sent} (skipped ${escalated.skipped})`);

    const failedPayments = await this.checkUpcomingRenewals();
    this.logger.log(`Found ${failedPayments.length} upcoming renewals to process`);
  }

  /**
   * Escalate dunning emails for subscriptions in grace period:
   * day 0   — payment-failed email (sent at webhook time)
   * day 3   — reminder
   * day 6   — final warning
   * day 7   — canceled by processExpiredGracePeriods
   */
  private async processDunningEmails() {
    const now = new Date();
    const candidates = await this.prisma.subscription.findMany({
      where: {
        status: 'IN_GRACE_PERIOD',
        paymentFailedAt: { not: null },
        graceUntil: { gt: now },
      },
      include: { product: true, plan: true },
    });

    let sent = 0;
    let skipped = 0;

    for (const sub of candidates) {
      const failedAt = sub.paymentFailedAt as Date;
      const daysSince = (Date.now() - failedAt.getTime()) / (1000 * 60 * 60 * 24);

      const reminderSent = sub.lastDunningSentAt ? sub.lastDunningSentAt > failedAt : false;
      const finalSent = sub.lastDunningSentAt
        ? sub.lastDunningSentAt.getTime() >= failedAt.getTime() + 6 * 24 * 60 * 60 * 1000
        : false;

      let shouldSend: 'reminder' | 'final' | null = null;

      if (daysSince >= 6 && !finalSent) {
        shouldSend = 'final';
      } else if (daysSince >= 3 && !reminderSent) {
        shouldSend = 'reminder';
      }

      if (!shouldSend) {
        skipped += 1;
        continue;
      }

      const success = await this.notificationsService
        .sendDunningReminderEmail(
          sub.customerEmail,
          sub.product.name,
          sub.plan.price,
          sub.graceUntil || now,
          shouldSend === 'final',
        )
        .then((r) => r.success)
        .catch((err) => {
          this.logger.error(`Failed to send dunning email for ${sub.id}`, err);
          return false;
        });

      if (success) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { lastDunningSentAt: new Date() },
        });
        sent += 1;
      } else {
        skipped += 1;
      }
    }

    return { sent, skipped };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async processHourlyTasks() {
    await this.processExpiringLicenses();
  }

  private async processExpiredGracePeriods() {
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'IN_GRACE_PERIOD',
        graceUntil: {
          lt: new Date(),
        },
      },
      include: {
        product: { select: { name: true } },
      },
    });

    for (const sub of expiredSubscriptions) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: 'CANCELED',
        },
      });

      await this.prisma.license.updateMany({
        where: { subscriptionId: sub.id },
        data: { active: false },
      });

      this.notificationsService.sendSubscriptionCanceled(
        sub.customerEmail,
        sub.product.name,
        sub.graceUntil || new Date()
      ).catch(err => this.logger.error('Failed to send cancellation email', err));
    }

    return { processed: expiredSubscriptions.length };
  }

  private async checkUpcomingRenewals() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingRenewals = await this.prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: {
          lte: tomorrow,
          gt: new Date(),
        },
      },
      include: { product: true },
    });

    for (const sub of upcomingRenewals) {
      this.notificationsService.sendEmail({
        to: sub.customerEmail,
        subject: `Your ${sub.product.name} subscription renews tomorrow`,
        body: `Your subscription will automatically renew tomorrow. Please ensure your payment method is up to date.`
      }).catch(err => this.logger.error('Failed to send renewal reminder', err));
    }

    return upcomingRenewals;
  }

  private async processExpiringLicenses() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringLicenses = await this.prisma.license.findMany({
      where: {
        active: true,
        expiresAt: {
          lte: sevenDaysFromNow,
          gt: new Date(),
        },
      },
    });

    for (const license of expiringLicenses) {
      this.notificationsService.sendEmail({
        to: license.buyerEmail || '',
        subject: 'Your license expires soon',
        body: `Your license will expire on ${new Date(license.expiresAt!).toLocaleDateString()}. Renew now to avoid interruption.`
      }).catch(err => this.logger.error('Failed to send expiry reminder', err));
    }

    this.logger.log(`Processed ${expiringLicenses.length} expiring licenses`);
  }

  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyReports() {
    this.logger.log('Generating weekly analytics reports...');
    
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const [
        totalTransactions,
        totalRevenue,
        newSubscriptions,
        newLicenses,
        topProducts,
        topAffiliates,
      ] = await Promise.all([
        this.getTransactionCount(weekAgo),
        this.getTotalRevenue(weekAgo),
        this.getNewSubscriptions(weekAgo),
        this.getNewLicenses(weekAgo),
        this.getTopProducts(weekAgo),
        this.getTopAffiliates(weekAgo),
      ]);

      const report = {
        period: {
          start: weekAgo,
          end: new Date(),
          generatedAt: new Date(),
        },
        transactions: totalTransactions,
        revenue: totalRevenue,
        newSubscriptions,
        newLicenses,
        topProducts,
        topAffiliates,
      };

      this.logger.log(`Weekly report generated: ${totalTransactions} transactions, $${totalRevenue} revenue`);

      await this.sendWeeklyReportEmails(report);

      return report;
    } catch (error) {
      this.logger.error('Failed to generate weekly report', error);
    }
  }

  private async getTransactionCount(since: Date) {
    return this.prisma.transaction.count({
      where: { createdAt: { gte: since } },
    });
  }

  private async getTotalRevenue(since: Date) {
    const result = await this.prisma.transaction.aggregate({
      where: { 
        createdAt: { gte: since },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  private async getNewSubscriptions(since: Date) {
    return this.prisma.subscription.count({
      where: { createdAt: { gte: since } },
    });
  }

  private async getNewLicenses(since: Date) {
    return this.prisma.license.count();
  }

  private async getTopProducts(since: Date) {
    const products = await this.prisma.transaction.groupBy({
      by: ['productId'],
      where: { 
        createdAt: { gte: since },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const productIds = products.map(p => p.productId);
    const productDetails = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(productDetails.map(p => [p.id, p.name]));

    return products.map(p => ({
      productId: p.productId,
      productName: productMap.get(p.productId) || 'Unknown',
      transactionCount: p._count,
      revenue: p._sum.amount || 0,
    }));
  }

  private async getTopAffiliates(since: Date) {
    const affiliates = await this.prisma.affiliateCommission.groupBy({
      by: ['affiliateId'],
      where: { 
        createdAt: { gte: since },
        status: 'PAID',
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const affiliateIds = affiliates.map(a => a.affiliateId);
    const affiliateDetails = await this.prisma.affiliate.findMany({
      where: { id: { in: affiliateIds } },
      select: { id: true, affiliateCode: true, user: { select: { email: true } } },
    });

    const affiliateMap = new Map(affiliateDetails.map(a => [a.id, a]));

    return affiliates.map(a => {
      const details = affiliateMap.get(a.affiliateId);
      return {
        affiliateId: a.affiliateId,
        code: details?.affiliateCode || 'Unknown',
        email: details?.user?.email || 'Unknown',
        commissionCount: a._count,
        commissionAmount: a._sum.amount || 0,
      };
    });
  }

  private async sendWeeklyReportEmails(report: any) {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    });

    const html = this.generateReportHtml(report);

    for (const admin of admins) {
      await this.notificationsService.sendEmail({
        to: admin.email,
        subject: `Weekly SAABIZ Report - ${new Date().toLocaleDateString()}`,
        html,
      }).catch(err => this.logger.error(`Failed to send report to ${admin.email}`, err));
    }
  }

  private generateReportHtml(report: any): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #059669; }
    .stat-label { font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>SAABIZ Weekly Report</h1>
    <p>${report.period.start.toLocaleDateString()} - ${report.period.end.toLocaleDateString()}</p>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">${report.transactions}</div>
      <div class="stat-label">Transactions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">$${report.revenue.toFixed(2)}</div>
      <div class="stat-label">Revenue</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.newSubscriptions}</div>
      <div class="stat-label">New Subscriptions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.newLicenses}</div>
      <div class="stat-label">New Licenses</div>
    </div>
  </div>

  <h3>Top Products</h3>
  <table>
    <tr><th>Product</th><th>Transactions</th><th>Revenue</th></tr>
    ${report.topProducts.map((p: any) => `<tr><td>${p.productName}</td><td>${p.transactionCount}</td><td>$${p.revenue.toFixed(2)}</td></tr>`).join('')}
  </table>

  <h3>Top Affiliates</h3>
  <table>
    <tr><th>Code</th><th>Commissions</th><th>Amount</th></tr>
    ${report.topAffiliates.map((a: any) => `<tr><td>${a.code}</td><td>${a.commissionCount}</td><td>$${a.commissionAmount.toFixed(2)}</td></tr>`).join('')}
  </table>

  <p style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px;">
    Generated by SAABIZ Platform
  </p>
</body>
</html>`;
  }
}
