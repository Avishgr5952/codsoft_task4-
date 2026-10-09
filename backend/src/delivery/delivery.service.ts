import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDeliveryStatusDto, AssignDeliveryDto } from './dto/update-delivery-status.dto';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async getPartnerDeliveries(userId: string) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner profile not found');
    }

    const deliveries = await this.prisma.delivery.findMany({
      where: { deliveryPartnerId: partner.id },
      include: {
        order: {
          include: {
            user: { select: { firstName: true, lastName: true, phone: true, email: true } },
            orderItems: {
              include: {
                product: { select: { name: true, sku: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = deliveries.filter((d) => d.status !== DeliveryStatus.DELIVERED && d.status !== DeliveryStatus.FAILED).length;
    const completedCount = deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED).length;

    return {
      partner,
      metrics: {
        total: deliveries.length,
        pending: pendingCount,
        completed: completedCount,
      },
      deliveries,
    };
  }

  async updateDeliveryStatus(deliveryId: string, userId: string, dto: UpdateDeliveryStatusDto) {
    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { userId },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner profile not found');
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (delivery.deliveryPartnerId !== partner.id) {
      throw new ForbiddenException('You are not authorized to update this delivery');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const actualDelivery = dto.status === DeliveryStatus.DELIVERED ? new Date() : undefined;

      const del = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: dto.status,
          actualDelivery,
          deliveryNotes: dto.deliveryNotes || undefined,
        },
      });

      // Synchronize with parent Order and Vendor orders
      let orderStatus: OrderStatus | null = null;
      if (dto.status === DeliveryStatus.OUT_FOR_DELIVERY) {
        orderStatus = OrderStatus.OUT_FOR_DELIVERY;
      } else if (dto.status === DeliveryStatus.DELIVERED) {
        orderStatus = OrderStatus.DELIVERED;
      }

      if (orderStatus) {
        await tx.order.update({
          where: { id: delivery.orderId },
          data: { status: orderStatus },
        });

        await tx.vendorOrder.updateMany({
          where: { orderId: delivery.orderId },
          data: { status: orderStatus },
        });
      }

      // Notify customer
      await tx.notification.create({
        data: {
          userId: delivery.order.userId,
          title: `Delivery Update: Order #${delivery.order.orderNumber}`,
          message: `Your package status is now: ${dto.status.replace(/_/g, ' ')}.`,
          type: 'ORDER',
          link: `/orders/${delivery.orderId}`,
        },
      });

      return del;
    });

    return updated;
  }

  async assignDelivery(dto: AssignDeliveryDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const partner = await this.prisma.deliveryPartner.findUnique({
      where: { id: dto.deliveryPartnerId },
      include: { user: true },
    });

    if (!partner) {
      throw new NotFoundException('Delivery partner not found');
    }

    const existingDelivery = await this.prisma.delivery.findFirst({
      where: { orderId: dto.orderId },
    });

    let delivery;
    if (existingDelivery) {
      delivery = await this.prisma.delivery.update({
        where: { id: existingDelivery.id },
        data: {
          deliveryPartnerId: dto.deliveryPartnerId,
          status: DeliveryStatus.ASSIGNED,
          deliveryNotes: dto.notes,
        },
      });
    } else {
      delivery = await this.prisma.delivery.create({
        data: {
          orderId: dto.orderId,
          deliveryPartnerId: dto.deliveryPartnerId,
          status: DeliveryStatus.ASSIGNED,
          deliveryNotes: dto.notes,
        },
      });
    }

    // Notify delivery partner
    await this.prisma.notification.create({
      data: {
        userId: partner.userId,
        title: 'New Delivery Assignment',
        message: `Order #${order.orderNumber} has been assigned to you for delivery.`,
        type: 'ORDER',
        link: '/delivery/dashboard',
      },
    });

    return delivery;
  }

  async getAllPartners() {
    return this.prisma.deliveryPartner.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        _count: { select: { deliveries: true } },
      },
    });
  }
}
