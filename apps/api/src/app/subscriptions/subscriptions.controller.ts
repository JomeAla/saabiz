import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CancelSubscriptionDto, UpgradeSubscriptionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Get('my-subscriptions')
  async getMySubscriptions(@Request() req) {
    return this.subscriptionsService.getCustomerSubscriptions(req.user.email);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @Post('cancel')
  async cancelSubscription(@Request() req, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionsService.cancelSubscription(req.user.email, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @Post('upgrade')
  async upgradeSubscription(@Request() req, @Body() dto: UpgradeSubscriptionDto) {
    return this.subscriptionsService.upgradeSubscription(req.user.email, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  @Get('plans/:productId')
  async getAvailablePlans(@Param('productId') productId: string) {
    return this.subscriptionsService.getAvailablePlans(productId);
  }
}
