import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('paystack')
  async handlePaystackWebhook(@Headers('x-paystack-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    return this.webhooksService.handlePaystackWebhook(signature, req.rawBody!);
  }

  @Post('flutterwave')
  async handleFlutterwaveWebhook(@Headers('verif-hash') signature: string, @Body() payload: any) {
    return this.webhooksService.handleFlutterwaveWebhook(signature, payload);
  }

  @Post('stripe')
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    return this.webhooksService.handleStripeWebhook(signature, req.rawBody!);
  }
}
