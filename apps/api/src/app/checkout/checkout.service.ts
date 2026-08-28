import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { TaxService } from '../tax/tax.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { PrismaService } from '../prisma.service';
import { TenantService } from '../tenancy/tenant.service';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly taxService: TaxService,
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService
  ) {}

  private async resolveConfig() {
    const tenantId = this.tenantService.scopeTenantId();
    if (tenantId) {
      const tenantConfig = await this.prisma.platformConfig.findFirst({ where: { tenantId } });
      if (tenantConfig) return tenantConfig;
    }
    const platformConfig = await this.prisma.platformConfig.findFirst({ where: { tenantId: null } });
    if (platformConfig) return platformConfig;
    return this.prisma.platformConfig.findFirst();
  }

  private async assertTenantScope(product: { id: string; sellerId: string; seller?: { tenantId: string | null } | null }) {
    const tenantId = this.tenantService.scopeTenantId();
    if (tenantId === undefined) return; // platform context (or no context) - any product allowed
    if (tenantId === null) {
      throw new NotFoundException('Unknown storefront domain');
    }
    const seller = product.seller
      ? product.seller
      : await this.prisma.seller.findUnique({ where: { id: product.sellerId }, select: { tenantId: true } });
    if (!seller || seller.tenantId !== tenantId) {
      throw new NotFoundException('Product not available on this storefront');
    }
  }

  async initializePayment(dto: InitializePaymentDto) {
    const { email, productId, planId, gateway, currency, reference, countryCode, refCode } = dto;
    const config = await this.resolveConfig();

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: { product: { include: { seller: true } } }
    });

    if (!plan || plan.productId !== productId) {
      throw new BadRequestException('Invalid product or plan configuration. Please refresh.');
    }

    await this.assertTenantScope(plan.product);

    let subtotal = plan.price;
    let taxAmount = 0;
    let taxRate = 0;
    let taxName = '';
    let taxCountry = '';

    if (countryCode) {
      const taxResult = await this.taxService.calculateTax(subtotal, countryCode);
      taxAmount = taxResult.taxAmount;
      taxRate = taxResult.taxRate;
      taxName = taxResult.taxName;
      taxCountry = taxResult.country;
    }

    const total = subtotal + taxAmount;

    let paymentResult;
    if (gateway === 'paystack') {
      if (!config?.paystackActive) throw new BadRequestException('Paystack payment is disabled by admin');
      paymentResult = await this.paystackService.initializeTransaction(email, total, reference || '', productId, planId, refCode);
    } else if (gateway === 'flutterwave') {
      if (!config?.flutterwaveActive) throw new BadRequestException('Flutterwave payment is disabled by admin');
      paymentResult = await this.flutterwaveService.initializeTransaction(email, total, reference || '', productId, planId, undefined, refCode);
    } else {
      throw new BadRequestException('Invalid payment gateway');
    }

    return {
      ...paymentResult,
      pricing: {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(taxAmount * 100) / 100,
        taxRate,
        taxName,
        taxCountry,
        total: Math.round(total * 100) / 100,
        currency: currency || 'NGN',
      }
    };
  }

  async verifyPayment(reference: string, gateway: string) {
    if (gateway === 'paystack') {
      return this.paystackService.verifyTransaction(reference);
    } else if (gateway === 'flutterwave') {
      return this.flutterwaveService.verifyTransaction(reference);
    } else {
      throw new BadRequestException('Invalid payment gateway');
    }
  }

  async getPublicConfig() {
    const config = await this.resolveConfig();
    return {
      paystackActive: !!config?.paystackActive,
      flutterwaveActive: !!config?.flutterwaveActive,
      platformName: 'SAABIZ',
    };
  }
}