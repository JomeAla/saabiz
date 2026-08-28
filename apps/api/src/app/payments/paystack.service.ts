import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TenantService } from '../tenancy/tenant.service';
import axios from 'axios';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private prisma: PrismaService,
    private tenantService: TenantService
  ) {}

  private async getHeaders() {
    const tenantId = this.tenantService.scopeTenantId();
    if (tenantId) {
      const tenantConfig = await this.prisma.platformConfig.findFirst({ where: { tenantId } });
      if (tenantConfig?.paystackSecretKey) {
        return {
          Authorization: `Bearer ${tenantConfig.paystackSecretKey}`,
          'Content-Type': 'application/json',
        };
      }
    }
    const platformConfig = await this.prisma.platformConfig.findFirst({ where: { tenantId: null } });
    const config = platformConfig ?? (await this.prisma.platformConfig.findFirst());
    if (!config?.paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }
    return {
      Authorization: `Bearer ${config.paystackSecretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeTransaction(email: string, amount: number, reference: string, productId: string, planId: string, affiliateCode?: string) {
    try {
      const headers = await this.getHeaders();
      const metadata: any = {
        custom_fields: [
          { display_name: "Product ID", variable_name: "product_id", value: productId },
          { display_name: "Plan ID", variable_name: "plan_id", value: planId }
        ],
        productId,
        planId
      };
      if (affiliateCode) {
        metadata.custom_fields.push({ display_name: "Affiliate Code", variable_name: "affiliate_code", value: affiliateCode });
        metadata.affiliateCode = affiliateCode;
      }
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email,
          amount: Math.round(amount * 100),
          reference,
          metadata,
        },
        { headers }
      );
      return response.data;
    } catch (error: any) {
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
    } catch (error: any) {
      this.logger.error(`Paystack Verification Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async createTransferRecipient(name: string, email: string, bankCode: string, accountNumber: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        {
          type: 'nuban',
          name,
          email,
          bank_code: bankCode,
          account_number: accountNumber,
        },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack Create Recipient Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async initiateTransfer(amount: number, recipientCode: string, reason: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        {
          source: 'balance',
          amount: Math.round(amount * 100),
          recipient: recipientCode,
          reason,
        },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack Transfer Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async getTransferStatus(transferCode: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/transfer/${transferCode}`, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack Transfer Status Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async getBanks() {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(`${this.baseUrl}/bank`, {
        headers,
        params: { country: 'nigeria' }
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack Get Banks Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async resolveAccount(accountNumber: string, bankCode: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.get(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack Resolve Account Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }

  async refund(reference: string) {
    try {
      const headers = await this.getHeaders();
      const response = await axios.post(
        `${this.baseUrl}/refund`,
        { transaction: reference },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Paystack Refund Error: ${error.message}`, error.response?.data);
      throw error;
    }
  }
}
