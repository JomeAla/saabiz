import { Controller, Get, Post, Body, UseGuards, Query, BadRequestException } from '@nestjs/common';
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
  async getConfig(@Query('tenantId') tenantId?: string) {
    return this.paymentsService.getPaymentConfig(tenantId || null);
  }

  @Post('config')
  async updateConfig(@Body() dto: UpdatePaymentConfigDto, @Query('tenantId') tenantId?: string) {
    return this.paymentsService.updatePaymentConfig(dto, tenantId || null);
  }
}