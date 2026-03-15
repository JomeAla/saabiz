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
      const { reference, amount, metadata } = event.data;
      const productId = metadata?.productId || metadata?.custom_fields?.find((f: any) => f.variable_name === 'product_id')?.value;
      const planId = metadata?.planId || metadata?.custom_fields?.find((f: any) => f.variable_name === 'plan_id')?.value;

      if (!productId || !planId) {
         this.logger.error('Webhook missing metadata (productId/planId)', event.data);
         return { status: 'ignored' };
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          reference,
          amount: amount / 100,
          gateway: 'paystack',
          status: 'success',
          product: { connect: { id: productId } },
          plan: { connect: { id: planId } },
        },
      });

      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
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
          product: { connect: { id: productId } },
          transaction: { connect: { id: transaction.id } },
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
      const { tx_ref, amount, meta } = payload.data;
      
      const productId = meta?.productId;
      const planId = meta?.planId;

      if (!productId || !planId) {
         this.logger.error('Webhook missing meta (productId/planId)', payload.data);
         return { status: 'ignored' };
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          reference: tx_ref,
          amount,
          gateway: 'flutterwave',
          status: 'success',
          product: { connect: { id: productId } },
          plan: { connect: { id: planId } },
        },
      });

      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
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
          product: { connect: { id: productId } },
          transaction: { connect: { id: transaction.id } },
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

    const stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2024-06-20' });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, config.webhookSecret);
    } catch (err: any) {
      this.logger.error(`Stripe Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const productId = session.metadata?.productId;
      const planId = session.metadata?.planId;

      if (!productId || !planId) {
         this.logger.error('Webhook missing metadata (productId/planId)', session);
         return { status: 'ignored' };
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          reference: session.id,
          amount: (session.amount_total || 0) / 100,
          gateway: 'stripe',
          status: 'success',
          product: { connect: { id: productId } },
          plan: { connect: { id: planId } },
        },
      });

      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
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
          product: { connect: { id: productId } },
          transaction: { connect: { id: transaction.id } },
        },
      });
    }

    return { status: 'success' };
  }
}
