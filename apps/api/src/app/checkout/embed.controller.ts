import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private subscriptionsService: SubscriptionsService,
    private prisma: PrismaService,
  ) {}

  @Get('config')
  async getCheckoutConfig() {
    const config = await this.prisma.platformConfig.findFirst();
    return {
      paystackActive: config?.paystackActive || false,
      flutterwaveActive: config?.flutterwaveActive || false,
      platformName: 'SAABIZ',
    };
  }

  @Get('embed/:productId/:planId')
  async getEmbedCheckout(
    @Param('productId') productId: string,
    @Param('planId') planId: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { seller: true, plans: true },
    });

    if (!product || product.isFrozen) {
      return { error: 'Product not available' };
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

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.isFrozen) {
      throw new Error('Product not available');
    }

    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    let checkoutUrl = `http://localhost:3000/checkout?productId=${productId}&planId=${planId}&email=${email}`;
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
    return `<div id="saabiz-checkout-widget" data-product="${productId}" data-plan="${planId}"></div>
<script src="https://localhost:3000/js/checkout-widget.js"></script>`;
  }
}
