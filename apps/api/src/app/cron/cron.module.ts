import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [NotificationsModule],
  providers: [CronService, PrismaService],
  exports: [CronService],
})
export class CronModule {}
