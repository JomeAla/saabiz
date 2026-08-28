import { Controller, Get, Post, Patch, Delete, Body, Query, UseGuards, Request, Param, ValidationPipe } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FreezeProductDto, UpdatePayoutDto, CreateUserDto, UpdateUserDto, CreatePromotionDto, UpdatePromotionDto, UpgradeSubscriptionDto, CreateTenantDto, UpdateTenantDto, AddDomainDto } from './dto/admin.dto';
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

  @Post('transactions/:id/refund')
  async refundTransaction(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.refundTransaction(id, body.reason);
  }

  // ==================== USER MANAGEMENT ====================
  @Get('users')
  async getUsers(@Query('role') role?: Role) {
    return this.adminService.getAllUsers(role);
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto) {
    return this.adminService.createUser(dto);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ==================== PROMOTION MANAGEMENT ====================
  @Get('promotions')
  async getPromotions() {
    return this.adminService.getAllPromotions();
  }

  @Get('promotions/:id')
  async getPromotion(@Param('id') id: string) {
    return this.adminService.getPromotionById(id);
  }

  @Post('promotions')
  async createPromotion(@Body() dto: CreatePromotionDto) {
    return this.adminService.createPromotion(dto);
  }

  @Patch('promotions/:id')
  async updatePromotion(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.adminService.updatePromotion(id, dto);
  }

  @Delete('promotions/:id')
  async deletePromotion(@Param('id') id: string) {
    return this.adminService.deletePromotion(id);
  }

  // ==================== SUBSCRIPTION MANAGEMENT ====================
  @Get('subscriptions')
  async getSubscriptions() {
    return this.adminService.getAllSubscriptions();
  }

  @Post('subscriptions/:id/upgrade')
  async upgradeSubscription(@Param('id') id: string, @Body() dto: UpgradeSubscriptionDto) {
    return this.adminService.upgradeSubscription({ ...dto, subscriptionId: id });
  }

  @Post('subscriptions/:id/cancel')
  async cancelSubscription(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.cancelSubscription(id, body.reason);
  }

  // ==================== TENANT MANAGEMENT ====================
  @Get('tenants')
  async getTenants() {
    return this.adminService.getAllTenants();
  }

  @Get('tenants/:id')
  async getTenant(@Param('id') id: string) {
    return this.adminService.getTenantById(id);
  }

  @Get('tenants/:id/analytics')
  async getTenantAnalytics(@Param('id') id: string) {
    return this.adminService.getTenantAnalytics(id);
  }

  @Post('tenants')
  async createTenant(@Body(new ValidationPipe()) dto: CreateTenantDto) {
    return this.adminService.createTenant(dto);
  }

  @Patch('tenants/:id')
  async updateTenant(@Param('id') id: string, @Body(new ValidationPipe()) dto: UpdateTenantDto) {
    return this.adminService.updateTenant(id, dto);
  }

  @Delete('tenants/:id')
  async deactivateTenant(@Param('id') id: string) {
    return this.adminService.deactivateTenant(id);
  }

  @Post('tenants/:id/domains')
  async addTenantDomain(@Param('id') id: string, @Body(new ValidationPipe()) dto: AddDomainDto) {
    return this.adminService.addTenantDomain(id, dto);
  }

  @Delete('tenants/:id/domains/:domainId')
  async removeTenantDomain(@Param('id') id: string, @Param('domainId') domainId: string) {
    return this.adminService.removeTenantDomain(id, domainId);
  }

  @Post('tenants/:id/domains/:domainId/primary')
  async setTenantPrimaryDomain(@Param('id') id: string, @Param('domainId') domainId: string) {
    return this.adminService.setTenantPrimaryDomain(id, domainId);
  }

  // ==================== WEBHOOK LOG & REPLAY ====================
  @Get('webhooks')
  async getWebhookEvents(
    @Query('gateway') gateway?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listWebhookEvents(gateway, status, limit ? parseInt(limit, 10) : undefined);
  }

  @Post('webhooks/:id/replay')
  async replayWebhook(@Param('id') id: string) {
    return this.adminService.replayWebhookEvent(id);
  }
}
