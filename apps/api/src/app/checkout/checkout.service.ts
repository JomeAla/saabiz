import { Injectable, BadRequestException } from '@nestjs/common';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly prisma: PrismaService
  ) {}

  async initializePayment(dto: InitializePaymentDto) {
    const { email, amount, gateway, currency, reference } = dto;

    if (gateway === 'paystack') {
      return this.paystackService.initializeTransaction(email, amount, reference);
    } else if (gateway === 'flutterwave') {
      return this.flutterwaveService.initializeTransaction(email, amount, reference);
    } else {
      throw new BadRequestException('Invalid payment gateway');
    }
  }

  async verifyPayment(reference: string, gateway: string) {
    if (gateway === 'paystack') {
      return this.paystackService.verifyTransaction(reference);
    } else if (gateway === 'flutterwave') {
      return this.flutterwaveService.verifyTransaction(reference);
    } else {
      throw new BadRequestException('Invalid payment gateway');
    }
  }
}
