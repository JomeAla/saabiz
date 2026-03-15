import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { StripeService } from '../payments/stripe.service';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeService, PaystackService, FlutterwaveService],
})
export class SubscriptionsModule {}
