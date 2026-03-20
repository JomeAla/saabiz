import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaService } from '../prisma.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [PaymentsModule, SubscriptionsModule, TaxModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, PrismaService],
})
export class CheckoutModule {}
