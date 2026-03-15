import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { ValidateLicenseDto } from './dto/validate-license.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('verify')
  async verifyLicense(@Body() dto: ValidateLicenseDto) {
    return this.licensesService.validateLicense(dto);
  }

  @Get('subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  async getSubscribers(@Request() req: any) {
    return this.licensesService.getSubscribersBySeller(req.user.userId);
  }
}
