import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FreezeProductDto, UpdatePayoutDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('gmv')
  async getGMV() {
    return this.adminService.getGMVByGateway();
  }

  @Get('sellers')
  async getSellers() {
    return this.adminService.getAllSellers();
  }

  @Get('payouts')
  async getPayouts(@Query('sellerId') sellerId?: string) {
    return this.adminService.getSellerPayouts(sellerId);
  }

  @Post('payouts')
  async processPayout(@Body() dto: UpdatePayoutDto) {
    return this.adminService.processPayout(dto);
  }

  @Get('products')
  async getProducts() {
    return this.adminService.getAllProducts();
  }

  @Post('products/freeze')
  async freezeProduct(@Body() dto: FreezeProductDto) {
    return this.adminService.freezeProduct(dto);
  }

  @Get('transactions')
  async getTransactions(
    @Query('gateway') gateway?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getTransactions({ gateway, status, startDate, endDate });
  }
}
