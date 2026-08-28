import { Module } from '@nestjs/common';
import { HoneypotsService } from './honeypots.service';
import { HoneypotsController } from './honeypots.controller';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [HoneypotsController],
  providers: [HoneypotsService, PrismaService, NotificationsService],
  exports: [HoneypotsService],
})
export class HoneypotsModule {}