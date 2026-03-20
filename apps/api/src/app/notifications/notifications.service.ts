import { Injectable, Logger } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendEmail(options: EmailOptions) {
    this.logger.log(`[EMAIL] To: ${options.to}, Subject: ${options.subject}`);
    this.logger.log(`[EMAIL] Body: ${options.body}`);
    
    return { success: true, message: 'Email logged (SMTP not configured)' };
  }

  async sendWelcomeEmail(email: string, name: string) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to SAABIZ!',
      body: `Hi ${name}, welcome to SAABIZ! We're excited to have you on board.`,
    });
  }

  async sendPaymentReceipt(email: string, amount: number, productName: string, invoiceNumber: string) {
    return this.sendEmail({
      to: email,
      subject: `Payment Receipt - ${invoiceNumber}`,
      body: `Thank you for your purchase of ${productName}. Amount: $${amount}. Invoice: ${invoiceNumber}`,
    });
  }

  async sendSubscriptionConfirmation(email: string, productName: string, planName: string) {
    return this.sendEmail({
      to: email,
      subject: 'Subscription Confirmed',
      body: `Your subscription to ${productName} (${planName}) has been confirmed.`,
    });
  }

  async sendLicenseKey(email: string, licenseKey: string, productName: string) {
    return this.sendEmail({
      to: email,
      subject: 'Your License Key',
      body: `Your license key for ${productName}: ${licenseKey}`,
    });
  }

  async sendRefundConfirmation(email: string, amount: number, reason?: string) {
    return this.sendEmail({
      to: email,
      subject: 'Refund Processed',
      body: `Your refund of $${amount} has been processed.${reason ? ` Reason: ${reason}` : ''}`,
    });
  }

  async sendSubscriptionCanceled(email: string, productName: string) {
    return this.sendEmail({
      to: email,
      subject: 'Subscription Canceled',
      body: `Your subscription to ${productName} has been canceled.`,
    });
  }
}
