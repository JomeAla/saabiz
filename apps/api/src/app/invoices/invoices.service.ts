import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async getCustomerInvoices(userId: string, userEmail: string) {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { buyerEmail: userEmail },
      include: {
        product: { include: { seller: true } },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map(t => this.generateInvoiceData(t));
  }

  async getInvoiceById(transactionId: string, userId: string, userEmail: string) {
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        OR: [
          { buyerEmail: userEmail },
          { subscription: { customerEmail: userEmail } }
        ]
      },
      include: {
        product: { include: { seller: true } },
        plan: true,
        subscription: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.generateInvoiceData(transaction);
  }

  private generateInvoiceData(transaction: any) {
    const invoiceNumber = `INV-${transaction.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = transaction.createdAt;
    const dueDate = transaction.createdAt;

    return {
      id: transaction.id,
      invoiceNumber,
      status: transaction.status,
      currency: transaction.currency,
      createdAt: invoiceDate,
      dueDate,
      buyer: {
        email: transaction.buyerEmail || transaction.subscription?.customerEmail,
      },
      seller: {
        name: transaction.product.seller.businessName || 'SAABIZ Seller',
        email: transaction.product.seller.user?.email,
      },
      product: {
        name: transaction.product.name,
        description: transaction.product.description,
      },
      plan: {
        name: transaction.plan.name,
        price: transaction.plan.price,
        interval: transaction.plan.interval,
      },
      subtotal: transaction.amount,
      platformFee: transaction.platformFee || 0,
      total: transaction.amount,
      payment: {
        gateway: transaction.gateway,
        reference: transaction.reference,
        date: transaction.createdAt,
      },
    };
  }
}
