import { Controller, Post, Body, Get, Query, ValidationPipe } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('initialize')
  async initializePayment(@Body(new ValidationPipe()) dto: InitializePaymentDto) {
    return this.checkoutService.initializePayment(dto);
  }

  @Get('config')
  async getPublicConfig() {
    return this.checkoutService.getPublicConfig();
  }

  @Get('verify')
  async verifyPayment(@Query('reference') reference: string, @Query('gateway') gateway: string) {
    return this.checkoutService.verifyPayment(reference, gateway);
  }
}
