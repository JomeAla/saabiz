import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          status: data.status || 'success',
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async logLogin(userId: string, email: string, ipAddress?: string, userAgent?: string) {
    await this.log({
      userId,
      userEmail: email,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress,
      userAgent,
    });
  }

  async logPayment(userId: string, email: string, amount: number, gateway: string, status: string, ipAddress?: string) {
    await this.log({
      userId,
      userEmail: email,
      action: 'PAYMENT',
      resource: 'transaction',
      details: { amount, gateway, status },
      ipAddress,
    });
  }

  async logRefund(adminId: string, transactionId: string, amount: number, reason?: string, ipAddress?: string) {
    await this.log({
      userId: adminId,
      action: 'REFUND',
      resource: 'transaction',
      resourceId: transactionId,
      details: { amount, reason },
      ipAddress,
    });
  }

  async logLicenseRevoke(userId: string, licenseKey: string, reason?: string, ipAddress?: string) {
    await this.log({
      userId,
      action: 'LICENSE_REVOKE',
      resource: 'license',
      resourceId: licenseKey,
      details: { reason },
      ipAddress,
    });
  }

  async logSettingsChange(userId: string, setting: string, oldValue: any, newValue: any, ipAddress?: string) {
    await this.log({
      userId,
      action: 'SETTINGS_CHANGE',
      resource: 'settings',
      resourceId: setting,
      details: { oldValue, newValue },
      ipAddress,
    });
  }

  async findAll(options?: { userId?: string; action?: string; startDate?: Date; endDate?: Date; limit?: number }) {
    const where: any = {};
    
    if (options?.userId) where.userId = options.userId;
    if (options?.action) where.action = options.action;
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) where.createdAt.gte = options.startDate;
      if (options?.endDate) where.createdAt.lte = options.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });
  }
}
