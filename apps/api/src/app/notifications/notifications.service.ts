import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  body?: string;
  html?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      
      this.logger.log('Email transporter initialized with SMTP configuration');
    } else {
      this.logger.warn('SMTP credentials not configured. Emails will be logged to console.');
      this.transporter = null;
    }
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    const { to, subject, body, html } = options;

    const emailHtml = html || this.wrapInTemplate(body || '', subject);

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"SAABIZ" <noreply@saabiz.com>',
          to,
          subject,
          text: body || '',
          html: emailHtml,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(`Email sent to ${to}: ${info.messageId}`);
        
        if (previewUrl) {
          this.logger.log(`Preview URL: ${previewUrl}`);
        }

        return { success: true, messageId: info.messageId, previewUrl: previewUrl || undefined };
      } catch (error) {
        this.logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
        return { success: false, messageId: undefined };
      }
    } else {
      this.logger.log(`[EMAIL - NOT SENT] To: ${to}, Subject: ${subject}`);
      this.logger.log(`[EMAIL - NOT SENT] Body: ${body}`);

      const testAccount = await nodemailer.createTestAccount();
      const previewUrl = `https://ethereal.email/message/${Buffer.from(testAccount.user).toString('base64')}`;
      this.logger.log(`Test account preview: ${previewUrl}`);

      return { success: true, previewUrl };
    }
  }

  private wrapInTemplate(content: string, title: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e5e7eb; border-top: none; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background: #f9fafb; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 0; }
    .button:hover { background: #059669; }
    .highlight { background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981; }
    .code { background: #1f2937; color: #10b981; padding: 10px 15px; border-radius: 4px; font-family: monospace; font-size: 14px; display: inline-block; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>SAABIZ - Merchant of Record Platform</p>
    <p>This email was sent by SAABIZ. If you have questions, please contact support.</p>
  </div>
</body>
</html>`;
  }

  async sendWelcomeEmail(email: string, name: string): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to SAABIZ!',
      html: `
        <h2>Hi ${name},</h2>
        <p>Welcome to <strong>SAABIZ</strong> - the Merchant of Record platform for software creators!</p>
        <p>We're excited to have you on board. Here's what you can do with SAABIZ:</p>
        <ul>
          <li>Sell your software globally with automatic tax compliance</li>
          <li>Offer subscription plans and one-time purchases</li>
          <li>Manage licenses and protect your software</li>
          <li>Track affiliates and manage commissions</li>
        </ul>
        <p>Get started by exploring our marketplace and setting up your first product!</p>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Get Started</a>
        </p>
        <div class="highlight">
          <strong>Need help?</strong> Reply to this email or visit our documentation.
        </div>
      `,
    });
  }

  async sendPaymentReceipt(email: string, amount: number, productName: string, invoiceNumber: string, transactionRef?: string): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: `Payment Receipt - ${invoiceNumber}`,
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Your payment has been successfully processed.</p>
        <div class="highlight">
          <strong>Invoice Number:</strong> ${invoiceNumber}<br>
          <strong>Product:</strong> ${productName}<br>
          <strong>Amount:</strong> $${amount.toFixed(2)}<br>
          ${transactionRef ? `<strong>Reference:</strong> ${transactionRef}` : ''}
        </div>
        <p>Your license key has been generated and is available in your account.</p>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/licenses" class="button">View Licenses</a>
        </p>
      `,
    });
  }

  async sendSubscriptionConfirmation(email: string, productName: string, planName: string, startDate: Date, endDate: Date): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: 'Subscription Confirmed - SAABIZ',
      html: `
        <h2>Your Subscription is Active!</h2>
        <p>Thank you for subscribing to <strong>${productName}</strong>.</p>
        <div class="highlight">
          <strong>Plan:</strong> ${planName}<br>
          <strong>Start Date:</strong> ${startDate.toLocaleDateString()}<br>
          <strong>Next Billing:</strong> ${endDate.toLocaleDateString()}
        </div>
        <p>You can manage your subscription, view invoices, and access your licenses from your account dashboard.</p>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/dashboard" class="button">Go to Dashboard</a>
        </p>
      `,
    });
  }

  async sendLicenseKey(email: string, licenseKey: string, productName: string, expiresAt?: Date): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: 'Your License Key - SAABIZ',
      html: `
        <h2>Your License Key is Ready!</h2>
        <p>Thank you for your purchase of <strong>${productName}</strong>.</p>
        <p>Here is your license key:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span class="code">${licenseKey}</span>
        </div>
        ${expiresAt ? `<p><em>This license expires on ${new Date(expiresAt).toLocaleDateString()}</em></p>` : ''}
        <div class="highlight">
          <strong>Installation Instructions:</strong><br>
          1. Download the software<br>
          2. Enter your license key<br>
          3. Activate and enjoy!
        </div>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/licenses" class="button">Download Software</a>
        </p>
      `,
    });
  }

  async sendRefundConfirmation(email: string, amount: number, reason?: string): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: 'Refund Processed - SAABIZ',
      html: `
        <h2>Your Refund has been Processed</h2>
        <p>We have processed your refund request.</p>
        <div class="highlight">
          <strong>Refund Amount:</strong> $${amount.toFixed(2)}<br>
          ${reason ? `<strong>Reason:</strong> ${reason}` : ''}
        </div>
        <p>Please note that it may take 5-10 business days for the refund to appear in your account, depending on your payment provider.</p>
        <p>If you have any questions about this refund, please contact our support team.</p>
      `,
    });
  }

  async sendSubscriptionCanceled(email: string, productName: string, effectiveDate: Date): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: 'Subscription Canceled - SAABIZ',
      html: `
        <h2>Your Subscription has been Canceled</h2>
        <p>Your subscription to <strong>${productName}</strong> has been canceled.</p>
        <div class="highlight">
          <strong>Effective Date:</strong> ${effectiveDate.toLocaleDateString()}
        </div>
        <p>You will continue to have access until this date. After that, your license will no longer be active.</p>
        <p>We'd love to have you back! If you have feedback on how we can improve, please reply to this email.</p>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/marketplace" class="button">Explore Other Products</a>
        </p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<any> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to: email,
      subject: 'Password Reset - SAABIZ',
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your SAABIZ account.</p>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        <p>Or copy this link: <span class="code">${resetUrl}</span></p>
        <div class="highlight">
          <strong>This link expires in 1 hour.</strong><br>
          If you didn't request this, please ignore this email.
        </div>
      `,
    });
  }

  async sendEmailVerification(email: string, verificationToken: string): Promise<any> {
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - SAABIZ',
      html: `
        <h2>Verify Your Email Address</h2>
        <p>Thank you for registering with SAABIZ!</p>
        <p>Please verify your email address by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="${verifyUrl}" class="button">Verify Email</a>
        </p>
        <p>Or copy this link: <span class="code">${verifyUrl}</span></p>
        <div class="highlight">
          <strong>This link expires in 24 hours.</strong>
        </div>
      `,
    });
  }

  async sendSubscriptionRenewalReminder(email: string, productName: string, renewalDate: Date, amount: number): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: `Subscription Renewal Reminder - ${productName}`,
      html: `
        <h2>Your Subscription Renews Soon</h2>
        <p>This is a reminder that your subscription to <strong>${productName}</strong> will renew on <strong>${renewalDate.toLocaleDateString()}</strong>.</p>
        <div class="highlight">
          <strong>Amount:</strong> $${amount.toFixed(2)}<br>
          <strong>Renewal Date:</strong> ${renewalDate.toLocaleDateString()}
        </div>
        <p>No action is required. Your payment method on file will be charged automatically.</p>
        <p>If you have any questions or want to make changes, visit your account settings.</p>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/billing" class="button">Manage Subscription</a>
        </p>
      `,
    });
  }

  async sendLicenseExpiringReminder(email: string, licenseKey: string, productName: string, expiresAt: Date): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: 'License Expiring Soon - SAABIZ',
      html: `
        <h2>Your License Expires Soon</h2>
        <p>This is a reminder that your license for <strong>${productName}</strong> will expire soon.</p>
        <div class="highlight">
          <strong>License Key:</strong> ${licenseKey}<br>
          <strong>Expires:</strong> ${new Date(expiresAt).toLocaleDateString()}
        </div>
        <p>Renew now to ensure uninterrupted access to the software.</p>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/marketplace" class="button">Renew Now</a>
        </p>
      `,
    });
  }

  async sendAffiliateCommissionNotification(email: string, amount: number, productName: string, commissionId: string): Promise<any> {
    return this.sendEmail({
      to: email,
      subject: 'Commission Earned! - SAABIZ Affiliate',
      html: `
        <h2>You Earned a Commission!</h2>
        <p>Congratulations! You've earned a commission from a sale.</p>
        <div class="highlight">
          <strong>Product:</strong> ${productName}<br>
          <strong>Commission Amount:</strong> $${amount.toFixed(2)}<br>
          <strong>Commission ID:</strong> ${commissionId}
        </div>
        <p>Your commission will be paid out according to your affiliate payout schedule.</p>
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/affiliate/commissions" class="button">View Commissions</a>
        </p>
      `,
    });
  }
}
