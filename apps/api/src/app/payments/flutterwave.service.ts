import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class FlutterwaveService {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor(private prisma: PrismaService) {}

  private async getHeaders() {
    const config = await this.prisma.platformConfig.findFirst();

    if (!config?.flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    return {
      Authorization: `Bearer ${config.flutterwaveSecretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeTransaction(
    email: string,
    amount: number,
    tx_ref: string,
    productId: string,
    planId: string,
    customer_name?: string
  ) {
    try {
      const headers = await this.getHeaders();
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
          meta: {
            productId,
            planId
          },
          customizations: {
            title: 'SAABIZ Payment',
          },
        },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Flutterwave Initialization Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async verifyTransaction(transactionId: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/transactions/${transactionId}/verify`, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Flutterwave Verification Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async createTransferRecipient(
    accountNumber: string,
    bankCode: string,
    accountHolderName: string,
    currency: string = 'NGN'
  ) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/accounts/resolve`,
        {
          account_number: accountNumber,
          account_bank: bankCode,
        },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Flutterwave Create Recipient Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async initiateTransfer(
    accountNumber: string,
    bankCode: string,
    amount: number,
    accountHolderName: string,
    reference: string,
    currency: string = 'NGN'
  ) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/transfers`,
        {
          account_number: accountNumber,
          account_bank: bankCode,
          amount,
          currency,
          reference,
          beneficiary_name: accountHolderName,
        },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Flutterwave Transfer Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async getTransferStatus(reference: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/transfers/${reference}`, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Flutterwave Transfer Status Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async getBanks(country: string = 'NG') {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/banks/${country}`, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Flutterwave Get Banks Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }
}
