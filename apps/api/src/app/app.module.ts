import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenancyModule } from './tenancy/tenancy.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { PaymentsModule } from './payments/payments.module';
import { CheckoutModule } from './checkout/checkout.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ProductsModule } from './products/products.module';
import { PlansModule } from './plans/plans.module';
import { LicensesModule } from './licenses/licenses.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { SellerModule } from './seller/seller.module';
import { InvoicesModule } from './invoices/invoices.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TaxModule } from './tax/tax.module';
import { CronModule } from './cron/cron.module';
import { LoggerModule } from './logger/logger.module';
import { AuditModule } from './audit/audit.module';
import { EventsModule } from './events/events.module';
import { HoneypotsModule } from './honeypots/honeypots.module';

@Module({
  imports: [
    TenancyModule,
    LoggerModule,
    AuditModule,
    EventsModule,
    HoneypotsModule,
    AuthModule, 
    PaymentsModule, 
    CheckoutModule, 
    WebhooksModule,
    ProductsModule,
    PlansModule,
    LicensesModule,
    SubscriptionsModule,
    AdminModule,
    AffiliatesModule,
    SellerModule,
    InvoicesModule,
    NotificationsModule,
    TaxModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
