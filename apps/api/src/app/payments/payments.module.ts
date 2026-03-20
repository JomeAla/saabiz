import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma.service';
import { PaystackService } from './paystack.service';
import { FlutterwaveService } from './flutterwave.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService, PaystackService, FlutterwaveService],
  exports: [PaymentsService, PaystackService, FlutterwaveService],
})
export class PaymentsModule {}
