import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

export interface HoneypotHitContext {
  endpoint: string;
  machineId?: string;
  domain?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface BotSubmissionContext {
  form: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class HoneypotsService {
  private readonly logger = new Logger(HoneypotsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ------------------------------------------------------------------
  // License decoy keys (anti-piracy)
  // ------------------------------------------------------------------

  generateKey(): string {
    return `SAABIZ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  }

  async create(productId: string, label?: string, key?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const finalKey = (key || this.generateKey()).toUpperCase().trim();

    const keyCollision = await this.prisma.license.findUnique({
      where: { key: finalKey },
      select: { id: true },
    });
    if (keyCollision) throw new ConflictException('Key is already in use by a real license');

    try {
      return await this.prisma.honeypot.create({
        data: { productId, key: finalKey, label: label || null },
        include: { product: { select: { id: true, name: true } } },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Honeypot key already exists');
      throw error;
    }
  }

  async findAll(productId?: string) {
    return this.prisma.honeypot.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { id: true, name: true } },
        _count: { select: { hits: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const honeypot = await this.prisma.honeypot.findUnique({
      where: { id },
      include: { product: { select: { id: true, name: true } } },
    });
    if (!honeypot) throw new NotFoundException('Honeypot key not found');
    return honeypot;
  }

  async update(id: string, data: { label?: string; isActive?: boolean }) {
    const honeypot = await this.findById(id);
    return this.prisma.honeypot.update({
      where: { id: honeypot.id },
      data: {
        ...(data.label !== undefined ? { label: data.label || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: { product: { select: { id: true, name: true } } },
    });
  }

  async remove(id: string) {
    const honeypot = await this.findById(id);
    await this.prisma.honeypotHit.deleteMany({ where: { honeypotId: honeypot.id } });
    await this.prisma.honeypot.delete({ where: { id: honeypot.id } });
    return { success: true, message: 'Honeypot key deleted' };
  }

  async getHits(id: string, limit = 200) {
    await this.findById(id);
    return this.prisma.honeypotHit.findMany({
      where: { honeypotId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Core trap. Returns true when the supplied key is an active decoy for the
   * given product. Records a HoneypotHit, writes an audit-log entry and fires
   * an alert email to the product's seller + platform admins.
   */
  async isDecoy(key: string, productId: string | undefined, ctx: HoneypotHitContext): Promise<boolean> {
    if (!key) return false;
    const normalizedKey = key.toUpperCase().trim();

    const honeypot = await this.prisma.honeypot.findUnique({
      where: { key: normalizedKey },
      include: {
        product: {
          include: { seller: { include: { user: { select: { email: true } } } } },
        },
      },
    });

    if (!honeypot || !honeypot.isActive) return false;
    if (productId && honeypot.productId !== productId) return false;

    try {
      await this.prisma.honeypotHit.create({
        data: {
          honeypotId: honeypot.id,
          endpoint: ctx.endpoint,
          machineId: ctx.machineId || null,
          domain: ctx.domain || null,
          ipAddress: ctx.ipAddress || null,
          userAgent: ctx.userAgent || null,
          metadata: (ctx.metadata as any) || undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record honeypot hit for ${normalizedKey}`, error);
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'HONEYPOT_HIT',
        resource: 'license',
        resourceId: normalizedKey,
        details: {
          productId: honeypot.productId,
          endpoint: ctx.endpoint,
          machineId: ctx.machineId || undefined,
          domain: ctx.domain || undefined,
        },
        ipAddress: ctx.ipAddress || undefined,
        userAgent: ctx.userAgent || undefined,
        status: 'warning',
      },
    }).catch((error) => this.logger.error('Failed to write honeypot audit log', error));

    this.logger.warn(
      `HONEYPOT HIT: decoy ${normalizedKey} (product ${honeypot.productId}) used on endpoint ${ctx.endpoint}` +
        (ctx.domain ? ` domain=${ctx.domain}` : '') +
        (ctx.machineId ? ` machine=${ctx.machineId}` : '') +
        ` from ${ctx.ipAddress || 'unknown ip'}`,
    );

    void this.alertOwner(normalizedKey, honeypot.product, ctx);

    return true;
  }

  private async alertOwner(
    licenseKey: string,
    product: { id: string; name: string; seller: { user: { email: string } | null } | null },
    ctx: HoneypotHitContext,
  ) {
    try {
      const recipients: string[] = [];
      if (product.seller?.user?.email) recipients.push(product.seller.user.email);

      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true },
      });
      for (const admin of admins) {
        if (admin.email && !recipients.includes(admin.email)) recipients.push(admin.email);
      }

      for (const to of recipients) {
        await this.notifications
          .sendHoneypotAlert(to, {
            licenseKey,
            productName: product.name,
            endpoint: ctx.endpoint,
            machineId: ctx.machineId,
            domain: ctx.domain,
            ipAddress: ctx.ipAddress,
          })
          .catch((error) => this.logger.error(`Failed to send honeypot alert to ${to}`, error));
      }
    } catch (error) {
      this.logger.error('Failed to send honeypot alert emails', error);
    }
  }

  // ------------------------------------------------------------------
  // Bot trap (hidden form field)
  // ------------------------------------------------------------------

  async recordBotSubmission(ctx: BotSubmissionContext): Promise<void> {
    try {
      await this.prisma.botSubmission.create({
        data: {
          form: ctx.form,
          email: ctx.email || null,
          ipAddress: ctx.ipAddress || null,
          userAgent: ctx.userAgent || null,
          metadata: (ctx.metadata as any) || undefined,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to record bot submission (${ctx.form})`, error);
      return;
    }

    await this.prisma.auditLog.create({
      data: {
        action: 'BOT_SUBMISSION',
        resource: 'form',
        resourceId: ctx.form,
        details: { email: ctx.email || undefined },
        ipAddress: ctx.ipAddress || undefined,
        userAgent: ctx.userAgent || undefined,
        status: 'warning',
      },
    }).catch((error) => this.logger.error('Failed to write bot submission audit log', error));

    this.logger.warn(
      `BOT SUBMISSION: ${ctx.form} form ${ctx.email ? `with email ${ctx.email} ` : ''}from ${ctx.ipAddress || 'unknown ip'}`,
    );
  }

  async listBotSubmissions(limit = 100) {
    return this.prisma.botSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }
}