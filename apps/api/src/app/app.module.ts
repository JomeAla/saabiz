import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { PaymentsModule } from './payments/payments.module';
import { CheckoutModule } from './checkout/checkout.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [AuthModule, PaymentsModule, CheckoutModule, WebhooksModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
