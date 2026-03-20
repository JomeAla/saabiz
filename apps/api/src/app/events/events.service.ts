import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma.service';

export interface PaymentCompletedEvent {
  transactionId: string;
  reference: string;
  buyerEmail: string;
  amount: number;
  gateway: string;
  productId: string;
  planId: string;
}

export interface SubscriptionCreatedEvent {
  subscriptionId: string;
  customerEmail: string;
  productId: string;
  planId: string;
  gateway: string;
}

export interface SubscriptionCanceledEvent {
  subscriptionId: string;
  customerEmail: string;
  productId: string;
}

export interface LicenseCreatedEvent {
  licenseKey: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  expiresAt?: Date;
}

export interface LicenseRevokedEvent {
  licenseKey: string;
  buyerEmail: string;
  productId: string;
  reason?: string;
}

export interface AffiliateCommissionEvent {
  affiliateId: string;
  transactionId: string;
  productId: string;
  amount: number;
}

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('EventsService initialized');
  }

  emitPaymentCompleted(event: PaymentCompletedEvent) {
    this.eventEmitter.emit('payment.completed', event);
  }

  emitSubscriptionCreated(event: SubscriptionCreatedEvent) {
    this.eventEmitter.emit('subscription.created', event);
  }

  emitSubscriptionCanceled(event: SubscriptionCanceledEvent) {
    this.eventEmitter.emit('subscription.canceled', event);
  }

  emitLicenseCreated(event: LicenseCreatedEvent) {
    this.eventEmitter.emit('license.created', event);
  }

  emitLicenseRevoked(event: LicenseRevokedEvent) {
    this.eventEmitter.emit('license.revoked', event);
  }

  emitAffiliateCommission(event: AffiliateCommissionEvent) {
    this.eventEmitter.emit('affiliate.commission', event);
  }

  @OnEvent('payment.completed')
  async handlePaymentCompleted(event: PaymentCompletedEvent) {
    this.logger.log(`Processing payment completed: ${event.reference}`);

    try {
      const invoiceNumber = `INV-${event.transactionId.slice(0, 8).toUpperCase()}`;
      
      this.notificationsService.sendPaymentReceipt(
        event.buyerEmail,
        event.amount,
        'Product',
        invoiceNumber
      ).catch(err => this.logger.error('Failed to send payment receipt', err));
    } catch (error) {
      this.logger.error('Error handling payment completed event', error);
    }
  }

  @OnEvent('license.created')
  async handleLicenseCreated(event: LicenseCreatedEvent) {
    this.logger.log(`Processing license created: ${event.licenseKey}`);

    try {
      this.notificationsService.sendLicenseKey(
        event.buyerEmail,
        event.licenseKey,
        event.productName
      ).catch(err => this.logger.error('Failed to send license key', err));
    } catch (error) {
      this.logger.error('Error handling license created event', error);
    }
  }

  @OnEvent('subscription.canceled')
  async handleSubscriptionCanceled(event: SubscriptionCanceledEvent) {
    this.logger.log(`Processing subscription canceled: ${event.subscriptionId}`);

    try {
      this.notificationsService.sendEmail({
        to: event.customerEmail,
        subject: 'Your Subscription Has Been Cancelled',
        body: `
        <h2>Subscription Cancelled</h2>
        <p>Your subscription has been cancelled. You will retain access until the end of your billing period.</p>
        <p>If this was a mistake, please contact support.</p>
        `
      }).catch(err => this.logger.error('Failed to send cancellation email', err));
    } catch (error) {
      this.logger.error('Error handling subscription canceled event', error);
    }
  }

  @OnEvent('affiliate.commission')
  async handleAffiliateCommission(event: AffiliateCommissionEvent) {
    this.logger.log(`Processing affiliate commission for affiliate: ${event.affiliateId}`);

    try {
      await this.prisma.affiliateCommission.create({
        data: {
          affiliateId: event.affiliateId,
          transactionId: event.transactionId,
          productId: event.productId,
          amount: event.amount,
          status: 'PENDING',
        },
      });

      await this.prisma.affiliate.update({
        where: { id: event.affiliateId },
        data: {
          totalReferrals: { increment: 1 },
          pendingPayout: { increment: event.amount },
        },
      });
    } catch (error) {
      this.logger.error('Error handling affiliate commission event', error);
    }
  }
}
