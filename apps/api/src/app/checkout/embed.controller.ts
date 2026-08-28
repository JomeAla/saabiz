import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TenantService } from '../tenancy/tenant.service';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutEmbedController {
  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService,
    private checkoutService: CheckoutService,
  ) {}

  @Get('embed/:productId/:planId')
  async getEmbedCheckout(
    @Param('productId') productId: string,
    @Param('planId') planId: string,
  ) {
    const tenantId = this.tenantService.scopeTenantId();
    if (tenantId === null) {
      throw new NotFoundException('Unknown storefront domain');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { seller: { include: { tenant: true } }, plans: true },
    });

    if (!product || product.isFrozen) {
      return { error: 'Product not available' };
    }

    if (tenantId !== undefined && product.seller.tenantId !== tenantId) {
      return { error: 'Product not available on this storefront' };
    }

    const plan = product.plans.find(p => p.id === planId);
    if (!plan) {
      return { error: 'Plan not found' };
    }

    return {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        seller: product.seller.businessName,
      },
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        interval: plan.interval,
      },
      embedCode: this.generateEmbedCode(productId, planId),
    };
  }

  @Post('initialize-embed')
  async initializeEmbedCheckout(@Body() body: {
    productId: string;
    planId: string;
    email: string;
    gateway: string;
  }) {
    const { productId, planId, email, gateway } = body;

    const tenantId = this.tenantService.scopeTenantId();
    if (tenantId === null) {
      throw new NotFoundException('Unknown storefront domain');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true },
    });

    if (!product || product.isFrozen) {
      throw new NotFoundException('Product not available');
    }

    if (tenantId !== undefined && product.seller.tenantId !== tenantId) {
      throw new NotFoundException('Product not available on this storefront');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.productId !== productId) {
      throw new NotFoundException('Plan not found');
    }

    let checkoutUrl = `${this.tenantService.frontendUrl()}/checkout?productId=${productId}&planId=${planId}&email=${encodeURIComponent(email)}`;
    if (gateway) {
      checkoutUrl += `&gateway=${gateway}`;
    }

    return {
      checkoutUrl,
      product: product.name,
      plan: plan.name,
      price: plan.price,
    };
  }

  private generateEmbedCode(productId: string, planId: string): string {
    const scheme = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const webUrl = this.tenantService.frontendUrl();
    return `<div id="saabiz-checkout-widget" data-product="${productId}" data-plan="${planId}"></div>
<script src="${webUrl}/js/checkout-widget.js" data-api-url="${scheme}://${this.tenantService.current()?.host || 'localhost:3001'}"></script>`;
  }
}