import { Controller, Post, Get, Body, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ActivationsService, ActivationResult } from './activations.service';
import { ActivateLicenseDto } from './dto/activate-license.dto';
import { DeactivateLicenseDto } from './dto/deactivate-license.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('License Activation')
@Controller('licenses')
export class ActivationsController {
  constructor(private readonly activationsService: ActivationsService) {}

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Activate a license', 
    description: 'Activates a license on the current machine. Requires authentication.' 
  })
  @ApiBody({ type: ActivateLicenseDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Activation result',
    schema: {
      example: {
        success: true,
        licenseKey: 'SAABIZ-XXXX-XXXX-XXXX',
        machineId: '8f8c8d8e-1234-5678-9abc-def012345678',
        activations: 1,
        maxActivations: 1,
        isActivated: true,
        expiresAt: '2026-12-31T23:59:59.000Z',
        productName: 'SaaS Analytics Pro',
        message: 'License activated successfully'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'License not found' })
  async activateLicense(
    @Body(new ValidationPipe({ transform: true })) dto: ActivateLicenseDto,
    @Request() req: any,
  ): Promise<ActivationResult> {
    return this.activationsService.activateLicense(
      dto.licenseKey,
      dto.machineId,
      dto.productId,
      { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] },
    );
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Deactivate a license', 
    description: 'Deactivates a license on the current machine. Use this before activating on a new machine.' 
  })
  @ApiBody({ type: DeactivateLicenseDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Deactivation result',
    schema: {
      example: {
        success: true,
        licenseKey: 'SAABIZ-XXXX-XXXX-XXXX',
        machineId: '8f8c8d8e-1234-5678-9abc-def012345678',
        activations: 0,
        maxActivations: 1,
        isActivated: false,
        expiresAt: '2026-12-31T23:59:59.000Z',
        productName: 'SaaS Analytics Pro',
        message: 'License deactivated successfully'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'License not found' })
  async deactivateLicense(
    @Body(new ValidationPipe({ transform: true })) dto: DeactivateLicenseDto,
    @Request() req: any,
  ): Promise<ActivationResult> {
    return this.activationsService.deactivateLicense(
      dto.licenseKey,
      dto.machineId,
      dto.productId,
      { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] },
    );
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Check activation status', 
    description: 'Check if a license is activated on the current machine' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Activation status',
    schema: {
      example: {
        success: true,
        licenseKey: 'SAABIZ-XXXX-XXXX-XXXX',
        machineId: '8f8c8d8e-1234-5678-9abc-def012345678',
        activations: 1,
        maxActivations: 1,
        isActivated: true,
        expiresAt: '2026-12-31T23:59:59.000Z',
        productName: 'SaaS Analytics Pro',
        message: 'License is active on this machine'
      }
    }
  })
  async getStatus(
    @Body('licenseKey') licenseKey: string,
    @Body('machineId') machineId: string,
    @Body('productId') productId: string,
    @Request() req: any,
  ): Promise<ActivationResult> {
    return this.activationsService.getActivationStatus(licenseKey, machineId, productId, {
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
  }
}
