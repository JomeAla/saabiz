import { Controller, Post, Body, Headers, Req, RawBodyRequest } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('paystack')
  async handlePaystackWebhook(@Headers('x-paystack-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    let eventId: string | null = null;
    try {
      const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
      let parsed: any = {};
      try {
        parsed = JSON.parse(raw.toString());
      } catch {
        /* not JSON — let the handler fail with a signature error */
      }
      eventId = await this.webhooksService.recordIncoming(
        'paystack',
        parsed?.event || 'unknown',
        parsed?.data?.reference,
        signature,
        raw.toString(),
        parsed,
      );
      const result = await this.webhooksService.handlePaystackWebhook(signature || '', raw);
      await this.webhooksService.markProcessed(eventId, (result as any)?.status || 'processed');
      return result;
    } catch (error: any) {
      await this.webhooksService.markFailed(eventId, error?.message || 'unknown error');
      throw error;
    }
  }

  @Post('flutterwave')
  async handleFlutterwaveWebhook(@Headers('verif-hash') signature: string, @Body() payload: any) {
    let eventId: string | null = null;
    try {
      eventId = await this.webhooksService.recordIncoming(
        'flutterwave',
        payload?.event || 'unknown',
        payload?.data?.tx_ref || payload?.data?.reference,
        signature,
        null,
        payload,
      );
      const result = await this.webhooksService.handleFlutterwaveWebhook(signature || '', payload);
      await this.webhooksService.markProcessed(eventId, (result as any)?.status || 'processed');
      return result;
    } catch (error: any) {
      await this.webhooksService.markFailed(eventId, error?.message || 'unknown error');
      throw error;
    }
  }
}