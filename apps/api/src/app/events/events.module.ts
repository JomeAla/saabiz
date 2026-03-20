import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsService } from './events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 100,
      ignoreErrors: false,
    }),
  ],
  providers: [EventsService, NotificationsService, PrismaService],
  exports: [EventsService],
})
export class EventsModule {}
