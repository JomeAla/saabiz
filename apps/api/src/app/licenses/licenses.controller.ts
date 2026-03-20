import { Controller, Post, Body, Get, UseGuards, Request, Param, Redirect } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LicensesService } from './licenses.service';
import { ValidateLicenseDto } from './dto/validate-license.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@ApiTags('licenses')
@Controller('licenses')
export class LicensesController {
  constructor(
    private readonly licensesService: LicensesService,
    private readonly prisma: PrismaService
  ) {}

  @Post('verify')
  @ApiOperation({ summary: 'Validate a license key', description: 'Verify if a license key is valid for a product' })
  @ApiBody({ type: ValidateLicenseDto })
  @ApiResponse({ status: 200, description: 'License validation result', schema: {
    example: {
      valid: true,
      productName: 'SaaS Analytics Pro',
      expiresAt: '2025-12-31T23:59:59.000Z'
    }
  }})
  async verifyLicense(@Body() dto: ValidateLicenseDto) {
    return this.licensesService.validateLicense(dto);
  }

  @Get('subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get license subscribers', description: 'Get all license holders for seller products' })
  @ApiResponse({ status: 200, description: 'List of subscribers' })
  async getSubscribers(@Request() req: any) {
    return this.licensesService.getSubscribersBySeller(req.user.userId);
  }

  @Get('my-downloads')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my downloads', description: 'Get all downloadable products the user has purchased' })
  @ApiResponse({ status: 200, description: 'List of purchased products with download URLs' })
  async getMyDownloads(@Request() req: any) {
    const licenses = await this.prisma.license.findMany({
      where: { buyerEmail: req.user.email, active: true },
      include: {
        product: {
          select: { id: true, name: true, downloadUrl: true, version: true }
        },
        transaction: {
          select: { plan: { select: { name: true, price: true } } }
        }
      },
      orderBy: { expiresAt: 'desc' }
    });

    return licenses.map((l: any) => ({
      id: l.id,
      licenseKey: l.key,
      productName: l.product.name,
      downloadUrl: l.product.downloadUrl,
      version: l.product.version,
      planName: l.transaction?.plan?.name,
      expiresAt: l.expiresAt,
      isActive: l.active,
    }));
  }

  @Get('download/:licenseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get download URL', description: 'Get the download URL for a specific license' })
  @ApiResponse({ status: 200, description: 'Download URL and metadata', schema: {
    example: {
      downloadUrl: 'https://cdn.example.com/product-v1.2.3.zip',
      version: '1.2.3',
      productName: 'SaaS Analytics Pro',
      licenseKey: 'SAABIZ-ABC123DEF456'
    }
  }})
  async downloadSoftware(@Request() req: any, @Param('licenseId') licenseId: string) {
    const license = await this.prisma.license.findFirst({
      where: { 
        id: licenseId,
        buyerEmail: req.user.email,
        active: true
      },
      include: { product: true }
    });

    if (!license) {
      return { error: 'License not found or inactive' };
    }

    if (!license.product.downloadUrl) {
      return { error: 'Download not available for this product' };
    }

    return { 
      downloadUrl: license.product.downloadUrl,
      version: license.product.version,
      productName: license.product.name,
      licenseKey: license.key
    };
  }
}
