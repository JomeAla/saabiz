import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma.service';
import { PaystackService } from './paystack.service';
import { FlutterwaveService } from './flutterwave.service';
import { StripeService } from './stripe.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, PaystackService, FlutterwaveService, StripeService],
  exports: [PaymentsService, PaystackService, FlutterwaveService, StripeService],
})
export class PaymentsModule {}
