import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaystackService } from '../payments/paystack.service';
import { FlutterwaveService } from '../payments/flutterwave.service';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly prisma: PrismaService
  ) {}

  async handlePaystackWebhook(signature: string, body: Buffer) {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const hash = crypto.createHmac('sha512', config.paystackSecretKey).update(body).digest('hex');
    if (hash !== signature) {
      throw new BadRequestException('Invalid Paystack signature');
    }

    const event = JSON.parse(body.toString());
    this.logger.log(`Received Paystack event: ${event.event}`)

    // Process the event here

    return { status: 'success' };
  }

  async handleFlutterwaveWebhook(signature: string, payload: any) {
    const config = await this.prisma.platformConfig.findFirst();
    if (!config?.webhookSecret) {
      throw new Error('Flutterwave webhook secret not configured');
    }

    if (signature !== config.webhookSecret) {
      throw new BadRequestException('Invalid Flutterwave signature');
    }

    this.logger.log(`Received Flutterwave event: ${payload.event}`)

    // Process the event here

    return { status: 'success' };
  }
}
