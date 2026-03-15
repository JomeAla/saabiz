import { Injectable, BadRequestException } from '@nestjs/common';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { StripeService } from '../payments/stripe.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService
  ) {}

  async initializePayment(dto: InitializePaymentDto) {
    const { email, productId, planId, gateway, currency, reference } = dto;
    const config = await this.prisma.platformConfig.findFirst();

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: { product: true }
    });

    if (!plan || plan.productId !== productId) {
      throw new BadRequestException('Invalid product or plan configuration. Please refresh.');
    }

    const amount = plan.price;

    if (gateway === 'paystack') {
      if (!config?.paystackActive) throw new BadRequestException('Paystack payment is disabled by admin');
      return this.paystackService.initializeTransaction(email, amount, reference || '', productId, planId);
    } else if (gateway === 'flutterwave') {
      if (!config?.flutterwaveActive) throw new BadRequestException('Flutterwave payment is disabled by admin');
      return this.flutterwaveService.initializeTransaction(email, amount, reference || '', productId, planId);
    } else if (gateway === 'stripe') {
      if (!config?.stripeActive) throw new BadRequestException('Stripe payment is disabled by admin');
      return this.stripeService.createCheckoutSession(email, amount, currency || 'usd', productId, planId);
    } else {
      throw new BadRequestException('Invalid payment gateway');
    }
  }

  async verifyPayment(reference: string, gateway: string) {
    if (gateway === 'paystack') {
      return this.paystackService.verifyTransaction(reference);
    } else if (gateway === 'flutterwave') {
      return this.flutterwaveService.verifyTransaction(reference);
    } else if (gateway === 'stripe') {
      return this.stripeService.verifySession(reference);
    } else {
      throw new BadRequestException('Invalid payment gateway');
    }
  }

  async getPublicConfig() {
    const config = await this.prisma.platformConfig.findFirst();
    return {
      paystackActive: !!config?.paystackActive,
      flutterwaveActive: !!config?.flutterwaveActive,
      stripeActive: !!config?.stripeActive,
    };
  }
}
