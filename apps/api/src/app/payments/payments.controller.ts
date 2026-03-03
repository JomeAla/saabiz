import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { UpdatePaymentConfigDto } from './dto/payment-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('config')
  async getConfig() {
    return this.paymentsService.getPaymentConfig();
  }

  @Post('config')
  async updateConfig(@Body() dto: UpdatePaymentConfigDto) {
    return this.paymentsService.updatePaymentConfig(dto);
  }
}
