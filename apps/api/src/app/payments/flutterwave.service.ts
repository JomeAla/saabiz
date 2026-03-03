import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor(private prisma: PrismaService) {}

  private async getHeaders(sellerId: string) {
    const config = await this.prisma.paymentConfig.findUnique({
      where: { sellerId },
    });

    if (!config?.flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    return {
      Authorization: `Bearer ${config.flutterwaveSecretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeTransaction(
    sellerId: string,
    email: string,
    amount: number,
    tx_ref: string,
    customer_name?: string
  ) {
    try {
      const headers = await this.getHeaders(sellerId);
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          tx_ref,
          amount,
          currency: 'NGN',
          redirect_url: 'http://localhost:4200/payment-status', // This should be configurable
          customer: {
            email,
            name: customer_name,
          },
          customizations: {
            title: 'SAABIZ Payment',
          },
        },
        { headers }
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Flutterwave Initialization Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async verifyTransaction(sellerId: string, transactionId: string) {
    try {
      const headers = await this.getHeaders(sellerId);
      const response = await axios.get(`${this.baseUrl}/transactions/${transactionId}/verify`, {
        headers,
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Flutterwave Verification Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }
}
