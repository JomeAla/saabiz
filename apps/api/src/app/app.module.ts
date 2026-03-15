import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { PaymentsModule } from './payments/payments.module';
import { CheckoutModule } from './checkout/checkout.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ProductsModule } from './products/products.module';
import { PlansModule } from './plans/plans.module';
import { LicensesModule } from './licenses/licenses.module';

@Module({
  imports: [
    AuthModule, 
    PaymentsModule, 
    CheckoutModule, 
    WebhooksModule,
    ProductsModule,
    PlansModule,
    LicensesModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
