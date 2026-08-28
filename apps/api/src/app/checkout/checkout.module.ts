import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutEmbedController } from './embed.controller';
import { CheckoutService } from './checkout.service';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaService } from '../prisma.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TaxModule } from '../tax/tax.module';

@Module({
  imports: [PaymentsModule, SubscriptionsModule, TaxModule],
  controllers: [CheckoutController, CheckoutEmbedController],
  providers: [CheckoutService, PrismaService],
})
export class CheckoutModule {}
