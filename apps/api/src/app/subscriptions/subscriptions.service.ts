import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StripeService } from '../payments/stripe.service';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { CancelSubscriptionDto, UpgradeSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private paystackService: PaystackService,
    private flutterwaveService: FlutterwaveService,
  ) {}

  async getCustomerSubscriptions(email: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { customerEmail: email },
      include: {
        product: true,
        plan: true,
        licenses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const licenses = await this.prisma.license.findMany({
      where: { buyerEmail: email },
      include: {
        product: true,
        transaction: {
          include: { plan: true }
        }
      },
    });

    return {
      subscriptions,
      licenses,
    };
  }

  async cancelSubscription(email: string, dto: CancelSubscriptionDto) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: dto.subscriptionId,
        customerEmail: email,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === 'CANCELED') {
      throw new BadRequestException('Subscription is already canceled');
    }

    try {
      if (subscription.gateway === 'stripe' && subscription.gatewaySubscriptionId) {
        await this.cancelStripeSubscription(subscription.gatewaySubscriptionId);
      } else if (subscription.gateway === 'paystack' && subscription.gatewaySubscriptionId) {
        await this.cancelPaystackSubscription(subscription.gatewaySubscriptionId);
      } else if (subscription.gateway === 'flutterwave' && subscription.gatewaySubscriptionId) {
        await this.cancelFlutterwaveSubscription(subscription.gatewaySubscriptionId);
      }

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
          status: 'CANCELED',
        },
      });

      await this.prisma.license.updateMany({
        where: { subscriptionId: subscription.id },
        data: { active: false },
      });

      return { success: true, message: 'Subscription will be canceled at the end of the billing period' };
    } catch (error: any) {
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  private async cancelStripeSubscription(subscriptionId: string) {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.stripeSecretKey) {
      throw new BadRequestException('Stripe is not configured');
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2024-06-20' });
    await stripe.subscriptions.cancel(subscriptionId);
  }

  private async cancelPaystackSubscription(subscriptionCode: string) {
    const headers = await this.getPaystackHeaders();
    const axios = require('axios');
    
    await axios.get(`https://api.paystack.co/subscription/${subscriptionCode}/disable`, {
      headers,
    });
  }

  private async cancelFlutterwaveSubscription(subscriptionId: string) {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.flutterwaveSecretKey) {
      throw new BadRequestException('Flutterwave is not configured');
    }
    const axios = require('axios');
    
    await axios.post('https://api.flutterwave.com/v3/subscriptions/' + subscriptionId + '/cancel', {}, {
      headers: { Authorization: `Bearer ${config.flutterwaveSecretKey}` },
    });
  }

  async upgradeSubscription(email: string, dto: UpgradeSubscriptionDto) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: dto.subscriptionId,
        customerEmail: email,
      },
      include: { plan: true, product: true },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== 'ACTIVE') {
      throw new BadRequestException('Can only upgrade active subscriptions');
    }

    const newPlan = await this.prisma.plan.findUnique({
      where: { id: dto.newPlanId },
    });

    if (!newPlan || newPlan.productId !== subscription.productId) {
      throw new BadRequestException('Invalid plan selected');
    }

    if (newPlan.price <= subscription.plan.price) {
      throw new BadRequestException('Upgrade to a higher tier plan');
    }

    const proration = this.calculateProration(subscription, newPlan);

    try {
      if (subscription.gateway === 'stripe' && subscription.gatewaySubscriptionId) {
        await this.upgradeStripeSubscription(subscription.gatewaySubscriptionId, newPlan.price, proration.proratedAmount);
      } else if (subscription.gateway === 'paystack' && subscription.gatewaySubscriptionId) {
        await this.createPaystackUpgradeInvoice(email, proration.proratedAmount, subscription.productId, newPlan.id);
      }

      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          planId: newPlan.id,
          currentPeriodEnd: new Date(),
        },
      });

      return { 
        success: true, 
        message: 'Subscription upgraded successfully', 
        newPlan,
        proration: {
          previousPrice: subscription.plan.price,
          newPrice: newPlan.price,
          daysRemaining: proration.daysRemaining,
          proratedAmount: proration.proratedAmount,
          totalDue: proration.proratedAmount,
        }
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to upgrade subscription: ${error.message}`);
    }
  }

  private calculateProration(subscription: any, newPlan: any) {
    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    const intervalDays = subscription.plan.interval === 'MONTHLY' ? 30 : 365;
    const dailyRateCurrent = subscription.plan.price / intervalDays;
    const dailyRateNew = newPlan.price / intervalDays;
    
    const priceDiff = dailyRateNew - dailyRateCurrent;
    const proratedAmount = Math.max(0, priceDiff * daysRemaining);

    return {
      daysRemaining,
      proratedAmount: Math.round(proratedAmount * 100) / 100,
    };
  }

  private async upgradeStripeSubscription(subscriptionId: string, newPrice: number, proratedAmount: number) {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.stripeSecretKey) {
      throw new BadRequestException('Stripe is not configured');
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(config.stripeSecretKey);
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0].id;
    
    await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: itemId,
        price_data: {
          currency: 'usd',
          product_data: { name: 'SAABIZ Subscription' },
          unit_amount: Math.round(newPrice * 100),
          recurring: { interval: subscription.items.data[0].price.recurring.interval },
        },
      }],
      proration_behavior: 'create_prorations',
    });
  }

  private async createPaystackUpgradeInvoice(email: string, amount: number, productId: string, planId: string) {
    const reference = `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const Paystack = require('axios');
    const config = await this.prisma.platformConfig.findFirst();
    
    if (!config?.paystackSecretKey) {
      throw new BadRequestException('Paystack is not configured');
    }

    await Paystack.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: Math.round(amount * 100),
      reference,
      metadata: {
        productId,
        planId,
        type: 'subscription_upgrade',
      },
    }, {
      headers: { Authorization: `Bearer ${config.paystackSecretKey}` }
    });
  }

  private async getPaystackHeaders() {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.paystackSecretKey) {
      throw new BadRequestException('Paystack is not configured');
    }
    return {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getAvailablePlans(productId: string) {
    return this.prisma.plan.findMany({
      where: { 
        productId,
        product: { isFrozen: false }
      },
      orderBy: { price: 'asc' },
    });
  }
}
