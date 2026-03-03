import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [PaymentsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, PrismaService],
})
export class CheckoutModule {}
