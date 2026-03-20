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

    const failedPayments = await this.checkUpcomingRenewals();
    this.logger.log(`Found ${failedPayments.length} upcoming renewals to process`);
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
        sub.productId
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
        body: `Your subscription will automatically renew tomorrow. Amount: $${sub.product.name}`
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
  }
}
