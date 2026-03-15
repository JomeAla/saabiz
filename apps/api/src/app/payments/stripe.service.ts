import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.initializeStripe();
  }

  private async initializeStripe() {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }
    this.stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2024-06-20' });
  }

  async createCheckoutSession(email: string, amount: number, currency: string, productId: string, planId: string) {
    try {
      // Re-initialize to ensure config is fresh if it was updated by admin
      await this.initializeStripe();

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency || 'usd',
              product_data: {
                name: 'SAABIZ Subscription',
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:4200/payment-success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:4200/payment-canceled',
        customer_email: email,
        metadata: {
          productId,
          planId
        }
      });
      return session;
    } catch (error: any) {
      this.logger.error(`Stripe Checkout Error: ${error.message}`);
      throw error;
    }
  }

  async verifySession(sessionId: string) {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error: any) {
      this.logger.error(`Stripe Session Verification Error: ${error.message}`);
      throw error;
    }
  }
}
