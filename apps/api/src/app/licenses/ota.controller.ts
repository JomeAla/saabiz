import { Controller, Post, Body, Get, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { HoneypotsService } from '../honeypots/honeypots.service';

@ApiTags('licenses')
@Controller('licenses')
export class Otacontroller {
  constructor(
    private prisma: PrismaService,
    private honeypots: HoneypotsService,
  ) {}

  @Post('ota-check')
  @ApiOperation({ summary: 'Check for software updates' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        licenseKey: { type: 'string', description: 'The license key' },
        productId: { type: 'string', description: 'The product ID' },
        currentVersion: { type: 'string', description: 'Current version of the software' },
      },
      required: ['licenseKey', 'productId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Update check result' })
  async checkForUpdates(
    @Req() req: Request,
    @Body() body: {
      licenseKey: string;
      productId: string;
      currentVersion?: string;
    },
  ) {
    const { licenseKey, productId, currentVersion } = body;

    if (!licenseKey || !productId) {
      return { valid: false, error: 'licenseKey and productId are required', updateAvailable: false };
    }

    const isDecoy = await this.honeypots.isDecoy(licenseKey, productId, {
      endpoint: 'ota-check',
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
      metadata: { currentVersion },
    });
    if (isDecoy) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, version: true },
      });
      return {
        valid: true,
        license: { key: licenseKey.toUpperCase().trim(), active: true, expiresAt: null },
        product: {
          id: product?.id || productId,
          name: product?.name || 'Software Product',
          version: product?.version || '1.0.0',
          downloadUrl: null,
        },
        updateAvailable: false,
        latestVersion: product?.version || '1.0.0',
        currentVersion: currentVersion || 'unknown',
      };
    }

    const license = await this.prisma.license.findFirst({
      where: { 
        key: licenseKey,
        productId,
      },
      include: { 
        product: {
          include: { seller: true }
        }
      }
    });

    if (!license || !license.active) {
      return {
        valid: false,
        error: 'License is invalid or inactive',
        updateAvailable: false,
      };
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      return {
        valid: false,
        error: 'License has expired',
        updateAvailable: false,
      };
    }

    const product = license.product;
    const latestVersion = product.version || '1.0.0';
    
    let updateAvailable = false;
    if (currentVersion && latestVersion !== currentVersion) {
      updateAvailable = this.isNewerVersion(latestVersion, currentVersion);
    }

    return {
      valid: true,
      license: {
        key: license.key,
        active: license.active,
        expiresAt: license.expiresAt,
      },
      product: {
        id: product.id,
        name: product.name,
        version: latestVersion,
        downloadUrl: product.downloadUrl,
      },
      updateAvailable,
      latestVersion,
      currentVersion: currentVersion || 'unknown',
    };
  }

  @Post('ota-validate')
  @ApiOperation({ summary: 'Validate license for OTA updates' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        licenseKey: { type: 'string', description: 'The license key' },
        productId: { type: 'string', description: 'The product ID' },
        machineId: { type: 'string', description: 'Optional machine identifier' },
        domain: { type: 'string', description: 'Optional domain' },
      },
      required: ['licenseKey', 'productId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async otaValidate(
    @Req() req: Request,
    @Body() body: {
      licenseKey: string;
      productId: string;
      machineId?: string;
      domain?: string;
    },
  ) {
    const { licenseKey, productId, machineId, domain } = body;

    if (!licenseKey || !productId) {
      return { valid: false, error: 'licenseKey and productId are required' };
    }

    const isDecoy = await this.honeypots.isDecoy(licenseKey, productId, {
      endpoint: 'ota-validate',
      machineId,
      domain,
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
    });
    if (isDecoy) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { name: true },
      });
      return {
        valid: true,
        productName: product?.name || 'Software Product',
        expiresAt: null,
        metadata: {
          validatedAt: new Date().toISOString(),
          machineId: machineId || 'not provided',
          domain: domain || 'not provided',
        },
      };
    }

    const license = await this.prisma.license.findFirst({
      where: { 
        key: licenseKey,
        productId,
      },
      include: { product: true }
    });

    if (!license || !license.active) {
      return {
        valid: false,
        error: 'License is invalid or inactive',
      };
    }

    if (license.expiresAt && license.expiresAt < new Date()) {
      return {
        valid: false,
        error: 'License has expired',
      };
    }

    return {
      valid: true,
      productName: license.product.name,
      expiresAt: license.expiresAt,
      metadata: {
        validatedAt: new Date().toISOString(),
        machineId: machineId || 'not provided',
        domain: domain || 'not provided',
      },
    };
  }

  private isNewerVersion(latest: string, current: string): boolean {
    const latestParts = latest.split('.').map(Number);
    const currentParts = current.split('.').map(Number);
    
    for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
      const l = latestParts[i] || 0;
      const c = currentParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  }
}
