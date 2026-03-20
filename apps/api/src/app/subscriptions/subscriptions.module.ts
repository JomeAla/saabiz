import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, PaystackService, FlutterwaveService, PrismaService],
})
export class SubscriptionsModule {}
