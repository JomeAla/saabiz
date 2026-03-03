import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { UpdatePaymentConfigDto } from './dto/payment-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  @Roles(Role.ADMIN, Role.SELLER)
  async getConfig(@Request() req: any) {
    const user = await this.paymentsService.getPaymentConfig(req.user.userId);
    return user;
  }

  @Post('config')
  @Roles(Role.ADMIN, Role.SELLER)
  async updateConfig(@Request() req: any, @Body() dto: UpdatePaymentConfigDto) {
    return this.paymentsService.updatePaymentConfig(req.user.userId, dto);
  }
}
