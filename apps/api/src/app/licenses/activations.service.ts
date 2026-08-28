import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { HoneypotsService } from '../honeypots/honeypots.service';

export interface ActivationResult {
  success: boolean;
  licenseKey: string;
  machineId: string;
  activations: number;
  maxActivations: number;
  isActivated: boolean;
  expiresAt: Date | null;
  productName: string;
  message?: string;
}

export interface ActivationContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivationsService {
  private readonly logger = new Logger(ActivationsService.name);

  constructor(
    private prisma: PrismaService,
    private honeypots: HoneypotsService,
  ) {}

  private async decoyResponse(
    endpoint: string,
    licenseKey: string,
    machineId: string,
    productId: string,
    ctx: ActivationContext | undefined,
    kind: 'activate' | 'deactivate' | 'status',
  ): Promise<ActivationResult | null> {
    const isDecoy = await this.honeypots.isDecoy(licenseKey, productId, {
      endpoint,
      machineId,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
    if (!isDecoy) return null;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { plans: true },
    });
    const maxActivations = product?.plans[0]?.maxActivations ?? 1;
    const normalizedKey = licenseKey.toUpperCase().trim();

    switch (kind) {
      case 'activate':
        return {
          success: true,
          licenseKey: normalizedKey,
          machineId,
          activations: 1,
          maxActivations,
          isActivated: true,
          expiresAt: null,
          productName: product?.name || 'Software Product',
          message: 'License activated successfully',
        };
      case 'deactivate':
        return {
          success: true,
          licenseKey: normalizedKey,
          machineId,
          activations: 0,
          maxActivations,
          isActivated: false,
          expiresAt: null,
          productName: product?.name || 'Software Product',
          message: 'License deactivated successfully. You can now activate on a new machine.',
        };
      case 'status':
        return {
          success: true,
          licenseKey: normalizedKey,
          machineId,
          activations: 1,
          maxActivations,
          isActivated: true,
          expiresAt: null,
          productName: product?.name || 'Software Product',
          message: 'License is active on this machine',
        };
    }
  }

  async activateLicense(
    licenseKey: string,
    machineId: string,
    productId: string,
    ctx?: ActivationContext,
  ): Promise<ActivationResult> {
    const normalizedKey = licenseKey.toUpperCase().trim();

    const decoy = await this.decoyResponse('activate', licenseKey, machineId, productId, ctx, 'activate');
    if (decoy) return decoy;

    const license = await this.prisma.license.findUnique({
      where: { key: normalizedKey },
      include: {
        product: {
          include: {
            plans: {
              where: { productId: productId },
            },
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License key not found');
    }

    if (license.productId !== productId) {
      throw new BadRequestException('License key does not match the product');
    }

    if (!license.active) {
      return {
        success: false,
        licenseKey: normalizedKey,
        machineId,
        activations: license.activations,
        maxActivations: license.product.plans[0]?.maxActivations || 1,
        isActivated: false,
        expiresAt: license.expiresAt,
        productName: license.product.name,
        message: 'License is inactive or revoked',
      };
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return {
        success: false,
        licenseKey: normalizedKey,
        machineId,
        activations: license.activations,
        maxActivations: license.product.plans[0]?.maxActivations || 1,
        isActivated: false,
        expiresAt: license.expiresAt,
        productName: license.product.name,
        message: 'License has expired',
      };
    }

    const plan = license.product.plans[0];
    const maxActivations = plan?.maxActivations ?? 1;

    if (license.machineId && license.machineId !== machineId) {
      if (maxActivations === 0) {
        await this.prisma.license.update({
          where: { id: license.id },
          data: {
            machineId: machineId,
            activations: { increment: 1 },
          },
        });
        
        this.logger.log(`Unlimited activation: ${normalizedKey} on ${machineId}`);
        
        return {
          success: true,
          licenseKey: normalizedKey,
          machineId,
          activations: license.activations + 1,
          maxActivations,
          isActivated: true,
          expiresAt: license.expiresAt,
          productName: license.product.name,
          message: 'License activated successfully',
        };
      }

      if (license.activations >= maxActivations) {
        return {
          success: false,
          licenseKey: normalizedKey,
          machineId,
          activations: license.activations,
          maxActivations,
          isActivated: false,
          expiresAt: license.expiresAt,
          productName: license.product.name,
          message: `Maximum activations (${maxActivations}) reached. Please deactivate another machine first.`,
        };
      }

      await this.prisma.license.update({
        where: { id: license.id },
        data: {
          machineId: machineId,
          activations: { increment: 1 },
        },
      });
    } else if (!license.machineId) {
      await this.prisma.license.update({
        where: { id: license.id },
        data: {
          machineId: machineId,
          activations: 1,
        },
      });
    }

    this.logger.log(`License activated: ${normalizedKey} on ${machineId}`);

    return {
      success: true,
      licenseKey: normalizedKey,
      machineId,
      activations: license.activations + (license.machineId === machineId ? 0 : 1),
      maxActivations,
      isActivated: true,
      expiresAt: license.expiresAt,
      productName: license.product.name,
      message: 'License activated successfully',
    };
  }

  async deactivateLicense(
    licenseKey: string,
    machineId: string,
    productId: string,
    ctx?: ActivationContext,
  ): Promise<ActivationResult> {
    const normalizedKey = licenseKey.toUpperCase().trim();

    const decoy = await this.decoyResponse('deactivate', licenseKey, machineId, productId, ctx, 'deactivate');
    if (decoy) return decoy;

    const license = await this.prisma.license.findUnique({
      where: { key: normalizedKey },
      include: {
        product: {
          include: {
            plans: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License key not found');
    }

    if (license.productId !== productId) {
      throw new BadRequestException('License key does not match the product');
    }

    if (!license.machineId) {
      return {
        success: true,
        licenseKey: normalizedKey,
        machineId,
        activations: 0,
        maxActivations: license.product.plans[0]?.maxActivations || 1,
        isActivated: false,
        expiresAt: license.expiresAt,
        productName: license.product.name,
        message: 'License was not activated on any machine',
      };
    }

    if (license.machineId !== machineId) {
      return {
        success: false,
        licenseKey: normalizedKey,
        machineId,
        activations: license.activations,
        maxActivations: license.product.plans[0]?.maxActivations || 1,
        isActivated: false,
        expiresAt: license.expiresAt,
        productName: license.product.name,
        message: 'This machine is not registered with this license',
      };
    }

    const newActivations = Math.max(0, license.activations - 1);
    
    await this.prisma.license.update({
      where: { id: license.id },
      data: {
        machineId: null,
        activations: newActivations,
      },
    });

    this.logger.log(`License deactivated: ${normalizedKey} from ${machineId}`);

    return {
      success: true,
      licenseKey: normalizedKey,
      machineId,
      activations: newActivations,
      maxActivations: license.product.plans[0]?.maxActivations || 1,
      isActivated: false,
      expiresAt: license.expiresAt,
      productName: license.product.name,
      message: 'License deactivated successfully. You can now activate on a new machine.',
    };
  }

  async getActivationStatus(
    licenseKey: string,
    machineId: string,
    productId: string,
    ctx?: ActivationContext,
  ): Promise<ActivationResult> {
    const normalizedKey = licenseKey.toUpperCase().trim();

    const decoy = await this.decoyResponse('status', licenseKey, machineId, productId, ctx, 'status');
    if (decoy) return decoy;

    const license = await this.prisma.license.findUnique({
      where: { key: normalizedKey },
      include: {
        product: {
          include: {
            plans: true,
          },
        },
      },
    });

    if (!license) {
      throw new NotFoundException('License key not found');
    }

    if (license.productId !== productId) {
      throw new BadRequestException('License key does not match the product');
    }

    const plan = license.product.plans[0];
    const maxActivations = plan?.maxActivations ?? 1;
    const isActivated = license.machineId === machineId && license.active;
    const isExpired = license.expiresAt && new Date(license.expiresAt) < new Date();

    return {
      success: license.active && !isExpired,
      licenseKey: normalizedKey,
      machineId,
      activations: license.activations,
      maxActivations,
      isActivated,
      expiresAt: license.expiresAt,
      productName: license.product.name,
      message: isActivated 
        ? 'License is active on this machine'
        : isExpired 
          ? 'License has expired'
          : 'License is not activated on this machine',
    };
  }
}
