import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

import Stripe from 'stripe';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly prisma: PrismaService
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
    this.logger.log(`Received Paystack event: ${event.event}`)

    if (event.event === 'charge.success') {
      const { reference, amount, metadata, customer } = event.data;
      const productId = metadata?.productId || metadata?.custom_fields?.find((f: any) => f.variable_name === 'product_id')?.value;
      const planId = metadata?.planId || metadata?.custom_fields?.find((f: any) => f.variable_name === 'plan_id')?.value;
      const buyerEmail = customer?.email || metadata?.email;

      if (!productId || !planId) {
         this.logger.error('Webhook missing metadata (productId/planId)', event.data);
         return { status: 'ignored' };
      }

      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
      
      let currentPeriodEnd = new Date();
      if (plan?.interval === 'MONTHLY') {
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
      } else if (plan?.interval === 'ANNUAL') {
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 365);
      }

      const subscription = plan?.interval !== 'ONETIME' ? await this.prisma.subscription.create({
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
      }) : null;

      const transaction = await this.prisma.transaction.create({
        data: {
          reference,
          amount: amount / 100,
          gateway: 'paystack',
          status: 'success',
          buyerEmail,
          product: { connect: { id: productId } },
          plan: { connect: { id: planId } },
          subscriptionId: subscription?.id,
          platformFee: (amount / 100) * 0.1,
          sellerEarnings: (amount / 100) * 0.9,
        },
      });

      let expiresAt: Date | null = null;
      if (plan?.interval === 'MONTHLY') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
      } else if (plan?.interval === 'ANNUAL') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 365);
      }

      await this.prisma.license.create({
        data: {
          key: `SAABIZ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
          active: true,
          expiresAt: expiresAt,
          buyerEmail,
          product: { connect: { id: productId } },
          transaction: { connect: { id: transaction.id } },
          subscriptionId: subscription?.id,
        },
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

    this.logger.log(`Received Flutterwave event: ${payload.event}`)

    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { tx_ref, amount, meta, customer } = payload.data;
      
      const productId = meta?.productId;
      const planId = meta?.planId;
      const buyerEmail = customer?.email || meta?.email;

      if (!productId || !planId) {
         this.logger.error('Webhook missing meta (productId/planId)', payload.data);
         return { status: 'ignored' };
      }

      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
      
      let currentPeriodEnd = new Date();
      if (plan?.interval === 'MONTHLY') {
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
      } else if (plan?.interval === 'ANNUAL') {
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 365);
      }

      const subscription = plan?.interval !== 'ONETIME' ? await this.prisma.subscription.create({
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
      }) : null;

      const transaction = await this.prisma.transaction.create({
        data: {
          reference: tx_ref,
          amount,
          gateway: 'flutterwave',
          status: 'success',
          buyerEmail,
          product: { connect: { id: productId } },
          plan: { connect: { id: planId } },
          subscriptionId: subscription?.id,
          platformFee: amount * 0.1,
          sellerEarnings: amount * 0.9,
        },
      });

      let expiresAt: Date | null = null;
      if (plan?.interval === 'MONTHLY') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
      } else if (plan?.interval === 'ANNUAL') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 365);
      }

      await this.prisma.license.create({
        data: {
          key: `SAABIZ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
          active: true,
          expiresAt: expiresAt,
          buyerEmail,
          product: { connect: { id: productId } },
          transaction: { connect: { id: transaction.id } },
          subscriptionId: subscription?.id,
        },
      });
    }

    return { status: 'success' };
  }

  async handleStripeWebhook(signature: string, body: Buffer) {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.stripeSecretKey) {
      throw new Error('Stripe configuration not present');
    }
    // We assume webhookSecret stores the stripe endpoint secret here, or we could add a stripeWebhookSecret
    if (!config?.webhookSecret) {
      throw new Error('Stripe webhook secret not present in webhookSecret field');
    }

    const stripe = new Stripe(config.stripeSecretKey);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
    } catch (err: any) {
      this.logger.error(`Stripe Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    this.logger.log(`Received Stripe event: ${event.type}`);

    // Handle new subscription/checkout
    if (event.type === 'checkout.session.completed') {
      await this.handleStripeCheckoutComplete(event.data.object as Stripe.Checkout.Session);
    }

    // Handle subscription renewal (recurring payment)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      await this.handleStripeRenewal(invoice);
    }

    // Handle subscription updates (cancelled, etc)
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      await this.handleStripeSubscriptionUpdate(subscription);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await this.handleStripeSubscriptionCanceled(subscription);
    }

    return { status: 'success' };
  }

  private async handleStripeCheckoutComplete(session: Stripe.Checkout.Session) {
    const productId = session.metadata?.productId;
    const planId = session.metadata?.planId;
    const buyerEmail = session.customer_details?.email || session.customer_email;

    if (!productId || !planId) {
      this.logger.error('Checkout missing metadata (productId/planId)', session);
      return;
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    
    let currentPeriodEnd = new Date();
    if (plan?.interval === 'MONTHLY') {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
    } else if (plan?.interval === 'ANNUAL') {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 365);
    }

    const subscription = plan?.interval !== 'ONETIME' ? await this.prisma.subscription.create({
      data: {
        customerEmail: buyerEmail,
        productId,
        planId,
        gateway: 'stripe',
        gatewaySubscriptionId: session.subscription as string,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd,
      },
    }) : null;

    const amount = (session.amount_total || 0) / 100;

    const transaction = await this.prisma.transaction.create({
      data: {
        reference: session.id,
        amount,
        gateway: 'stripe',
        status: 'success',
        buyerEmail,
        product: { connect: { id: productId } },
        plan: { connect: { id: planId } },
        subscriptionId: subscription?.id,
        platformFee: amount * 0.1,
        sellerEarnings: amount * 0.9,
      },
    });

    let expiresAt: Date | null = null;
    if (plan?.interval === 'MONTHLY') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else if (plan?.interval === 'ANNUAL') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);
    }

    await this.prisma.license.create({
      data: {
        key: `SAABIZ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        active: true,
        expiresAt: expiresAt,
        buyerEmail,
        product: { connect: { id: productId } },
        transaction: { connect: { id: transaction.id } },
        subscriptionId: subscription?.id,
      },
    });

    // Update seller earnings
    await this.updateSellerEarnings(productId, amount * 0.9);
  }

  private async handleStripeRenewal(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const subscription = await this.prisma.subscription.findFirst({
      where: { gatewaySubscriptionId: subscriptionId },
      include: { product: true, plan: true }
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for renewal: ${subscriptionId}`);
      return;
    }

    // Calculate new period
    const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
    if (subscription.plan.interval === 'MONTHLY') {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);
    } else if (subscription.plan.interval === 'ANNUAL') {
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 365);
    }

    // Update subscription period
    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        currentPeriodStart: subscription.currentPeriodEnd,
        currentPeriodEnd,
        status: 'ACTIVE',
      },
    });

    // Extend license
    const license = await this.prisma.license.findFirst({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: 'desc' }
    });

    if (license) {
      const newExpiresAt = license.expiresAt ? new Date(license.expiresAt) : new Date();
      if (subscription.plan.interval === 'MONTHLY') {
        newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      } else if (subscription.plan.interval === 'ANNUAL') {
        newExpiresAt.setDate(newExpiresAt.getDate() + 365);
      }

      await this.prisma.license.update({
        where: { id: license.id },
        data: { expiresAt: newExpiresAt, active: true },
      });
    }

    // Record transaction
    await this.prisma.transaction.create({
      data: {
        reference: `renewal_${invoice.id}`,
        amount: invoice.amount_paid / 100,
        gateway: 'stripe',
        status: 'success',
        buyerEmail: subscription.customerEmail,
        product: { connect: { id: subscription.productId } },
        plan: { connect: { id: subscription.planId } },
        subscriptionId: subscription.id,
        platformFee: (invoice.amount_paid / 100) * 0.1,
        sellerEarnings: (invoice.amount_paid / 100) * 0.9,
      },
    });

    // Update seller earnings
    await this.updateSellerEarnings(subscription.productId, (invoice.amount_paid / 100) * 0.9);

    this.logger.log(`Renewed subscription ${subscription.id} for ${invoice.amount_paid / 100}`);
  }

  private async handleStripeSubscriptionUpdate(subscription: Stripe.Subscription) {
    const dbSubscription = await this.prisma.subscription.findFirst({
      where: { gatewaySubscriptionId: subscription.id },
    });

    if (!dbSubscription) return;

    let status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' = 'ACTIVE';
    if (subscription.status === 'canceled') status = 'CANCELED';
    if (subscription.status === 'past_due') status = 'PAST_DUE';
    if (subscription.status === 'trialing') status = 'TRIALING';

    await this.prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status },
    });
  }

  private async handleStripeSubscriptionCanceled(subscription: Stripe.Subscription) {
    const dbSubscription = await this.prisma.subscription.findFirst({
      where: { gatewaySubscriptionId: subscription.id },
    });

    if (!dbSubscription) return;

    await this.prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status: 'CANCELED', cancelAtPeriodEnd: true },
    });
  }

  private async updateSellerEarnings(productId: string, amount: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true }
    });

    if (product?.seller) {
      await this.prisma.seller.update({
        where: { id: product.sellerId },
        data: { totalEarnings: { increment: amount } },
      });
    }
  }
}
