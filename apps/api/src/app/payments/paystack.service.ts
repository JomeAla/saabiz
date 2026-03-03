import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private prisma: PrismaService) {}

  private async getHeaders() {
    const config = await this.prisma.platformConfig.findFirst();

    if (!config?.paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    return {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeTransaction(email: string, amount: number, reference?: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount: Math.round(amount * 100), // Paystack expects amount in kobo
          reference,
        },
        { headers }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Paystack Initialization Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, {
        headers,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Paystack Verification Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }
}
