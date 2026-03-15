import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, PaystackService, FlutterwaveService],
})
export class AdminModule {}
