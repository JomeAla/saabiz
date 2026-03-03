import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [AuthModule, PaymentsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
