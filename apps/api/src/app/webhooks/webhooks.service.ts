import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

  async handlePaystackWebhook(signature: string, body: Buffer) {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const hash = crypto.createHmac('sha512', config.paystackSecretKey).update(body).digest('hex');
    if (hash !== signature) {
      throw new BadRequestException('Invalid Paystack signature');
    }

    const event = JSON.parse(body.toString());
    this.logger.log(`Received Paystack event: ${event.event}`);

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
        transactionData.subscriptionId = subscriptionId;
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
        licenseData.subscriptionId = subscriptionId;
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
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.webhookSecret) {
      throw new Error('Flutterwave webhook secret not configured');
    }

    if (signature !== config.webhookSecret) {
      throw new BadRequestException('Invalid Flutterwave signature');
    }

    this.logger.log(`Received Flutterwave event: ${payload.event}`);

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
        flutterwaveTransactionData.subscriptionId = subscriptionId;
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
        licenseData.subscriptionId = subscriptionId;
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
