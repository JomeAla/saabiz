import { Controller, Post, Body, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize a payment checkout session' })
  @ApiBody({ type: InitializePaymentDto })
  @ApiResponse({ status: 201, description: 'Checkout session created', schema: {
    example: {
      checkoutUrl: 'https://api.paystack.co/...',
      reference: 'chk_abc123'
    }
  }})
  @ApiResponse({ status: 400, description: 'Invalid product or plan' })
  async initializePayment(@Body(new ValidationPipe()) dto: InitializePaymentDto) {
    return this.checkoutService.initializePayment(dto);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get public payment gateway configuration' })
  @ApiResponse({ status: 200, description: 'Payment gateway public keys and settings', schema: {
    example: {
      paystack: { publicKey: 'pk_...', active: true },
      flutterwave: { publicKey: 'FLWPUBK-...', active: false }
    }
  }})
  async getPublicConfig() {
    return this.checkoutService.getPublicConfig();
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify a payment by reference' })
  @ApiQuery({ name: 'reference', description: 'Payment reference ID' })
  @ApiQuery({ name: 'gateway', description: 'Payment gateway (paystack/flutterwave)' })
  @ApiResponse({ status: 200, description: 'Payment verification result', schema: {
    example: {
      status: 'success',
      amount: 29.99,
      buyerEmail: 'customer@example.com'
    }
  }})
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(@Query('reference') reference: string, @Query('gateway') gateway: string) {
    return this.checkoutService.verifyPayment(reference, gateway);
  }
}
