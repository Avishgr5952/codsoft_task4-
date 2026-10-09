import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { PaymentRecordStatus, PaymentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async processPayment(dto: ProcessPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order has already been paid for');
    }

    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await this.prisma.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          orderId: order.id,
          transactionId,
          paymentMethod: dto.paymentMethod || 'MOCK_CARD',
          amount: dto.amount,
          currency: 'USD',
          status: PaymentRecordStatus.COMPLETED,
          paymentGatewayResponse: {
            mockSuccess: true,
            authCode: `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            processedAt: new Date().toISOString(),
          },
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
        },
      });

      return createdPayment;
    });

    return {
      success: true,
      transactionId: payment.transactionId,
      status: payment.status,
      message: 'Payment processed successfully',
    };
  }

  async getPaymentByOrder(orderId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found for this order');
    }

    return payment;
  }
}
