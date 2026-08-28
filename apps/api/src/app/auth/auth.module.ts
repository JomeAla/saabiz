import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificationsService } from '../notifications/notifications.service';
import { HoneypotsModule } from '../honeypots/honeypots.module';

@Module({
  imports: [
    PassportModule,
    HoneypotsModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
      signOptions: { 
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        issuer: 'SAABIZ',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, NotificationsService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
