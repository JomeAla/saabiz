import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RegisterDto, LoginDto, CustomerRegisterDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: Role.SELLER,
        emailVerifyToken: verifyToken,
        seller: {
          create: {
            businessName: dto.businessName
          }
        }
      },
      include: {
        seller: true
      }
    });

    const verifyLink = `http://localhost:3000/verify-email?token=${verifyToken}`;
    this.notificationsService.sendEmail({
      to: dto.email,
      subject: 'Welcome to SAABIZ - Verify Your Email',
      body: `Welcome! Click here to verify your email: ${verifyLink}`
    }).catch(err => console.error('Failed to send verification email:', err));

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        sellerId: user.seller?.id
      }
    };
  }

  async registerCustomer(dto: CustomerRegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: Role.CUSTOMER,
        emailVerifyToken: verifyToken,
      },
    });

    const verifyLink = `http://localhost:3000/verify-email?token=${verifyToken}`;
    this.notificationsService.sendEmail({
      to: dto.email,
      subject: 'Welcome to SAABIZ - Verify Your Email',
      body: `Welcome! Click here to verify your email: ${verifyLink}`
    }).catch(err => console.error('Failed to send verification email:', err));

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { seller: true }
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        sellerId: user.seller?.id
      }
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      }
    });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    
    this.notificationsService.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      body: `Click here to reset your password: ${resetLink}\n\nThis link expires in 1 hour.`
    }).catch(err => console.error('Failed to send email:', err));

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token }
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null
      }
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { message: 'If the email exists, a verification link will be sent' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified' };
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: verifyToken }
    });

    const verifyLink = `http://localhost:3000/verify-email?token=${verifyToken}`;
    
    this.notificationsService.sendEmail({
      to: email,
      subject: 'Verify Your Email',
      body: `Click here to verify your email: ${verifyLink}`
    }).catch(err => console.error('Failed to send email:', err));

    return { message: 'Verification link sent' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'super-secret-key-refresh',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { seller: true }
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const newAccessToken = await this.jwtService.signAsync(newPayload);
      
      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.id },
        { secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'super-secret-key-refresh', expiresIn: '7d' }
      );

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          sellerId: user.seller?.id
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    return { message: 'Logged out successfully' };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { seller: true, affiliate: true }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      sellerId: user.seller?.id,
      affiliateId: user.affiliate?.id,
    };
  }
}
