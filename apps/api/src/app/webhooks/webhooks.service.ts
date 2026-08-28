import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsService } from '../events/events.service';
import { AffiliatesService } from '../affiliates/affiliates.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsService: EventsService,
    private readonly affiliatesService: AffiliatesService,
  ) {}

  // ------------------------------------------------------------------
  // Webhook event log (audit + replay)
  // ------------------------------------------------------------------

  async recordIncoming(
    gateway: string,
    eventName: string,
    reference: string | undefined,
    signature: string | null | undefined,
    rawBody: string | null,
    payload: any,
  ) {
    try {
      const record = await this.prisma.webhookEvent.create({
        data: {
          gateway,
          eventName,
          reference: reference || null,
          signature: signature || null,
          rawBody,
          payload: payload || {},
          status: 'processing',
        },
      });
      return record.id;
    } catch (error) {
      this.logger.error(`Failed to record incoming ${gateway} webhook`, error);
      return null;
    }
  }

  async markProcessed(id: string | null, status: string, configId?: string) {
    if (!id) return;
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { status, configId: configId || null },
    }).catch((e) => this.logger.error('Failed to update webhook event status', e));
  }

  async markFailed(id: string | null, error: string) {
    if (!id) return;
    await this.prisma.webhookEvent.update({
      where: { id },
      data: { status: 'failed', error: error || 'unknown error' },
    }).catch((e) => this.logger.error('Failed to update webhook event status', e));
  }

  async listEvents(options?: { gateway?: string; status?: string; limit?: number }) {
    const where: any = {};
    if (options?.gateway) where.gateway = options.gateway;
    if (options?.status) where.status = options.status;
    return this.prisma.webhookEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(options?.limit || 100, 1), 500),
    });
  }

  /**
   * Re-run a previously received webhook through the normal handler with the
   * original signature/payload so gateway auth still passes.
   */
  async replayEvent(id: string) {
    const event = await this.prisma.webhookEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Webhook event not found');

    try {
      let result: any;
      if (event.gateway === 'paystack') {
        const raw = Buffer.from(event.rawBody || JSON.stringify(event.payload));
        result = await this.handlePaystackWebhook(event.signature || '', raw);
      } else {
        result = await this.handleFlutterwaveWebhook(event.signature || '', event.payload as any);
      }
      const status = (result as any)?.status || 'processed';
      await this.prisma.webhookEvent.update({
        where: { id },
        data: { replayCount: { increment: 1 }, lastReplayAt: new Date(), lastReplayStatus: status },
      });
      return result;
    } catch (error: any) {
      await this.prisma.webhookEvent.update({
        where: { id },
        data: { replayCount: { increment: 1 }, lastReplayAt: new Date(), lastReplayStatus: 'failed' },
      }).catch(() => undefined);
      throw error;
    }
  }

  // ------------------------------------------------------------------
  // Payment failure / dunning
  // ------------------------------------------------------------------

  private async handleSubscriptionPaymentFailure(subscriptionId: string, gateway: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { product: true, plan: true },
    });
    if (!subscription) return;

    const graceUntil = new Date();
    graceUntil.setDate(graceUntil.getDate() + 7);

    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'IN_GRACE_PERIOD',
        paymentFailedAt: new Date(),
        graceUntil,
      },
    });

    await this.prisma.license.updateMany({
      where: { subscriptionId },
      data: { active: false },
    });

    this.notificationsService.sendPaymentFailedEmail(
      subscription.customerEmail,
      subscription.product.name,
      subscription.plan.price,
      graceUntil,
    ).catch((err) => this.logger.error('Failed to send payment-failed email', err));

    await this.prisma.auditLog.create({
      data: {
        action: 'PAYMENT_FAILED',
        resource: 'subscription',
        resourceId: subscriptionId,
        details: { gateway, productId: subscription.productId, graceUntil },
        status: 'warning',
      },
    }).catch((e) => this.logger.error('Failed to write payment-failed audit log', e));

    this.logger.warn(`Payment failed for subscription ${subscriptionId} (${gateway}) — grace until ${graceUntil.toISOString()}`);
  }

  async handlePaystackWebhook(signature: string, body: Buffer) {
    const configs = await this.prisma.platformConfig.findMany({
      where: { paystackSecretKey: { not: null } },
    });
    const config = configs.find(
      (c) => c.paystackSecretKey && crypto.createHmac('sha512', c.paystackSecretKey).update(body).digest('hex') === signature
    );
    if (!config) {
      throw new BadRequestException('Invalid Paystack signature');
    }

    const event = JSON.parse(body.toString());
    this.logger.log(`Received Paystack event: ${event.event}`);

    if (event.event === 'charge.failed' || event.event === 'invoice.payment_failed') {
      const failedReference = event.data?.reference;
      const failedTx = failedReference
        ? await this.prisma.transaction.findUnique({ where: { reference: failedReference } })
        : null;
      if (failedTx?.subscriptionId) {
        await this.handleSubscriptionPaymentFailure(failedTx.subscriptionId, 'paystack');
      }
      return { status: 'success', handled: 'payment_failed' };
    }

    if (event.event === 'charge.success') {
      const { reference, amount, metadata, customer } = event.data;

      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { reference },
      });

      if (existingTransaction) {
        this.logger.warn(`Duplicate Paystack webhook received for reference: ${reference}`);
        return { status: 'duplicate', reference };
      }

      const productId = metadata?.productId || metadata?.custom_fields?.find((f: any) => f.variable_name === 'product_id')?.value;
      const planId = metadata?.planId || metadata?.custom_fields?.find((f: any) => f.variable_name === 'plan_id')?.value;
      const affiliateCode = metadata?.affiliateCode || metadata?.custom_fields?.find((f: any) => f.variable_name === 'affiliate_code')?.value;
      const buyerEmail = customer?.email || metadata?.email;

      if (!productId || !planId) {
         this.logger.error('Webhook missing metadata (productId/planId)', event.data);
         return { status: 'ignored' };
      }

      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
      const product = await this.prisma.product.findUnique({ where: { id: productId } });

      if (!plan) {
        this.logger.error('Plan not found for Paystack webhook', { planId });
        return { status: 'ignored' };
      }

      let subscriptionId: string | undefined;
      let isRenewal = false;

      if (plan?.interval !== 'ONETIME') {
        const existingSubscription = await this.prisma.subscription.findFirst({
          where: {
            gatewaySubscriptionId: reference,
            productId,
          },
        });

        if (existingSubscription) {
          isRenewal = true;
          subscriptionId = existingSubscription.id;
          const periodDays = plan.interval === 'MONTHLY' ? 30 : 365;
          const newPeriodEnd = new Date(existingSubscription.currentPeriodEnd);
          newPeriodEnd.setDate(newPeriodEnd.getDate() + periodDays);
          await this.prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              currentPeriodStart: existingSubscription.currentPeriodEnd,
              currentPeriodEnd: newPeriodEnd,
              status: 'ACTIVE',
              cancelAtPeriodEnd: false,
            },
          });
        } else {
          const currentPeriodEnd = new Date();
          if (plan.interval === 'MONTHLY') {
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
          } else if (plan.interval === 'ANNUAL') {
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 365);
          }
          const newSub = await this.prisma.subscription.create({
            data: {
              customerEmail: buyerEmail,
              productId,
              planId,
              gateway: 'paystack',
              gatewaySubscriptionId: reference,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd,
            },
          });
          subscriptionId = newSub.id;
          this.eventsService.emitSubscriptionCreated({
            subscriptionId: newSub.id,
            customerEmail: buyerEmail || '',
            productId,
            planId,
            gateway: 'paystack',
          });
        }
      }

      let affiliateId: string | undefined;
      if (affiliateCode) {
        const affiliate = await this.affiliatesService.getAffiliateByCode(affiliateCode);
        if (affiliate) {
          affiliateId = affiliate.id;
        }
      }

      const transactionAmount = amount / 100;
      const transactionData: any = {
        reference,
        amount: transactionAmount,
        gateway: 'paystack',
        status: 'success',
        buyerEmail: buyerEmail || '',
        product: { connect: { id: productId } },
        plan: { connect: { id: planId } },
        platformFee: transactionAmount * 0.1,
        sellerEarnings: transactionAmount * 0.9,
      };

      if (subscriptionId) {
        transactionData.subscription = { connect: { id: subscriptionId } };
      }
      if (affiliateId) {
        transactionData.affiliateId = affiliateId;
      }

      const transaction = await this.prisma.transaction.create({
        data: transactionData,
      });

      if (affiliateId && !isRenewal) {
        await this.affiliatesService.trackConversion(affiliateCode!, productId, transaction.id);
      }

      let expiresAt: Date | null = null;
      if (plan?.interval === 'MONTHLY') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
      } else if (plan?.interval === 'ANNUAL') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 365);
      }

      const licenseKey = `SAABIZ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const licenseData: any = {
        key: licenseKey,
        active: true,
        expiresAt: expiresAt,
        buyerEmail: buyerEmail || '',
        product: { connect: { id: productId } },
        transaction: { connect: { id: transaction.id } },
      };

      if (subscriptionId) {
        licenseData.subscription = { connect: { id: subscriptionId } };
      }

      await this.prisma.license.create({
        data: licenseData,
      });

      this.eventsService.emitPaymentCompleted({
        transactionId: transaction.id,
        reference,
        buyerEmail: buyerEmail || '',
        amount: transactionAmount,
        gateway: 'paystack',
        productId,
        planId,
      });

      this.eventsService.emitLicenseCreated({
        licenseKey,
        buyerEmail: buyerEmail || '',
        productId,
        productName: product?.name || 'Product',
        expiresAt: expiresAt ?? undefined,
      });
    }

    return { status: 'success' };
  }

  async handleFlutterwaveWebhook(signature: string, payload: any) {
    const configs = await this.prisma.platformConfig.findMany({
      where: { webhookSecret: { not: null } },
    });
    const config = configs.find((c) => c.webhookSecret && signature === c.webhookSecret);
    if (!config) {
      throw new BadRequestException('Invalid Flutterwave signature');
    }

    this.logger.log(`Received Flutterwave event: ${payload.event}`);

    if (payload.event === 'charge.failed' || payload.event === 'payment.failed') {
      const failedRef = payload.data?.tx_ref || payload.data?.reference;
      const failedTx = failedRef
        ? await this.prisma.transaction.findUnique({ where: { reference: failedRef } })
        : null;
      if (failedTx?.subscriptionId) {
        await this.handleSubscriptionPaymentFailure(failedTx.subscriptionId, 'flutterwave');
      }
      return { status: 'success', handled: 'payment_failed' };
    }

    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { tx_ref, amount, meta, customer } = payload.data;

      const existingTransaction = await this.prisma.transaction.findUnique({
        where: { reference: tx_ref },
      });

      if (existingTransaction) {
        this.logger.warn(`Duplicate Flutterwave webhook received for reference: ${tx_ref}`);
        return { status: 'duplicate', reference: tx_ref };
      }

      const productId = meta?.productId;
      const planId = meta?.planId;
      const affiliateCode = meta?.affiliateCode;
      const buyerEmail = customer?.email || meta?.email;

      if (!productId || !planId) {
         this.logger.error('Webhook missing meta (productId/planId)', payload.data);
         return { status: 'ignored' };
      }

      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
      const product = await this.prisma.product.findUnique({ where: { id: productId } });

      if (!plan) {
        this.logger.error('Plan not found for Flutterwave webhook', { planId });
        return { status: 'ignored' };
      }

      let subscriptionId: string | undefined;
      let isRenewal = false;

      if (plan?.interval !== 'ONETIME') {
        const existingSubscription = await this.prisma.subscription.findFirst({
          where: {
            gatewaySubscriptionId: tx_ref,
            productId,
          },
        });

        if (existingSubscription) {
          isRenewal = true;
          subscriptionId = existingSubscription.id;
          const periodDays = plan.interval === 'MONTHLY' ? 30 : 365;
          const newPeriodEnd = new Date(existingSubscription.currentPeriodEnd);
          newPeriodEnd.setDate(newPeriodEnd.getDate() + periodDays);
          await this.prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              currentPeriodStart: existingSubscription.currentPeriodEnd,
              currentPeriodEnd: newPeriodEnd,
              status: 'ACTIVE',
              cancelAtPeriodEnd: false,
            },
          });
        } else {
          const currentPeriodEnd = new Date();
          if (plan.interval === 'MONTHLY') {
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
          } else if (plan.interval === 'ANNUAL') {
            currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 365);
          }
          const newSub = await this.prisma.subscription.create({
            data: {
              customerEmail: buyerEmail,
              productId,
              planId,
              gateway: 'flutterwave',
              gatewaySubscriptionId: tx_ref,
              status: 'ACTIVE',
              currentPeriodStart: new Date(),
              currentPeriodEnd,
            },
          });
          subscriptionId = newSub.id;
          this.eventsService.emitSubscriptionCreated({
            subscriptionId: newSub.id,
            customerEmail: buyerEmail || '',
            productId,
            planId,
            gateway: 'flutterwave',
          });
        }
      }

      let affiliateId: string | undefined;
      if (affiliateCode) {
        const affiliate = await this.affiliatesService.getAffiliateByCode(affiliateCode);
        if (affiliate) {
          affiliateId = affiliate.id;
        }
      }

      const flutterwaveTransactionData: any = {
        reference: tx_ref,
        amount,
        gateway: 'flutterwave',
        status: 'success',
        buyerEmail: buyerEmail || '',
        product: { connect: { id: productId } },
        plan: { connect: { id: planId } },
        platformFee: amount * 0.1,
        sellerEarnings: amount * 0.9,
      };

      if (subscriptionId) {
        flutterwaveTransactionData.subscription = { connect: { id: subscriptionId } };
      }
      if (affiliateId) {
        flutterwaveTransactionData.affiliateId = affiliateId;
      }

      const transaction = await this.prisma.transaction.create({
        data: flutterwaveTransactionData,
      });

      if (affiliateId && !isRenewal) {
        await this.affiliatesService.trackConversion(affiliateCode!, productId, transaction.id);
      }

      let expiresAt: Date | null = null;
      if (plan?.interval === 'MONTHLY') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
      } else if (plan?.interval === 'ANNUAL') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 365);
      }

      const licenseKey = `SAABIZ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const licenseData: any = {
        key: licenseKey,
        active: true,
        expiresAt: expiresAt,
        buyerEmail: buyerEmail || '',
        product: { connect: { id: productId } },
        transaction: { connect: { id: transaction.id } },
      };

      if (subscriptionId) {
        licenseData.subscription = { connect: { id: subscriptionId } };
      }

      await this.prisma.license.create({
        data: licenseData,
      });

      this.eventsService.emitPaymentCompleted({
        transactionId: transaction.id,
        reference: tx_ref,
        buyerEmail: buyerEmail || '',
        amount,
        gateway: 'flutterwave',
        productId,
        planId,
      });

      this.eventsService.emitLicenseCreated({
        licenseKey,
        buyerEmail: buyerEmail || '',
        productId,
        productName: product?.name || 'Product',
        expiresAt: expiresAt ?? undefined,
      });
    }

    return { status: 'success' };
  }
}
