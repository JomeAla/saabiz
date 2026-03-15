import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateLinkDto, UpdateAffiliateProfileDto, TrackConversionDto } from './dto/affiliate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.affiliatesService.getAffiliateProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateAffiliateProfileDto) {
    return this.affiliatesService.updateAffiliateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('links')
  async getMyLinks(@Request() req) {
    return this.affiliatesService.getMyLinks(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('links')
  async createLink(@Request() req, @Body() dto: CreateAffiliateLinkDto) {
    return this.affiliatesService.createAffiliateLink(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('commissions')
  async getMyCommissions(@Request() req) {
    return this.affiliatesService.getMyCommissions(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payouts')
  async getMyPayouts(@Request() req) {
    return this.affiliatesService.getMyPayouts(req.user.id);
  }

  @Get('track/:code')
  async trackClick(@Param('code') code: string) {
    return this.affiliatesService.trackClick(code);
  }

  @Post('track')
  async trackConversion(@Body() dto: TrackConversionDto) {
    return this.affiliatesService.trackConversion(dto.code, dto.productId, dto.transactionId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/affiliates')
  async getAllAffiliates() {
    return this.affiliatesService.getAllAffiliates();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/commissions')
  async getAllCommissions() {
    return this.affiliatesService.getAllCommissions();
  }
}
