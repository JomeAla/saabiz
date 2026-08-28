import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../prisma.service';
import { EventsModule } from '../events/events.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';

@Module({
  imports: [PaymentsModule, NotificationsModule, EventsModule, AffiliatesModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, PrismaService],
  exports: [WebhooksService],
})
export class WebhooksModule {}