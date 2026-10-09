import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  Role,
  OrderStatus,
  PaymentStatus,
  PaymentRecordStatus,
  VendorStatus,
} from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly defaultCommissionPercent: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly inventoryService: InventoryService,
    private readonly couponsService: CouponsService,
  ) {
    this.defaultCommissionPercent = Number(
      this.configService.get('MARKETPLACE_COMMISSION_PERCENT', 10),
    );
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. Gather order items
    let checkoutItems: { productId: string; quantity: number }[] = [];

    if (dto.items && dto.items.length > 0) {
      checkoutItems = dto.items;
    } else {
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Your cart is empty. Add products to checkout.');
      }
      checkoutItems = cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
    }

    // 2. Fetch full product & inventory details
    const productIds = checkoutItems.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        vendor: true,
        inventory: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate products & stock
    let subtotal = 0;
    const vendorItemsMap = new Map<string, {
      vendor: any;
      items: { product: any; quantity: number; itemTotal: number }[];
      subtotal: number;
    }>();

    for (const item of checkoutItems) {
      const product = productMap.get(item.productId);
      if (!product || !product.isPublished) {
        throw new BadRequestException(`Product is unavailable or no longer exists`);
      }

      if (product.vendor.status !== VendorStatus.APPROVED) {
        throw new BadRequestException(
          `Product "${product.name}" belongs to a store that is currently not approved to sell`,
        );
      }

      const availableStock = product.inventory?.availableQuantity ?? 0;
      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Product "${product.name}" only has ${availableStock} units available in stock`,
        );
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      const vId = product.vendorId;
      if (!vendorItemsMap.has(vId)) {
        vendorItemsMap.set(vId, {
          vendor: product.vendor,
          items: [],
          subtotal: 0,
        });
      }

      const vGroup = vendorItemsMap.get(vId)!;
      vGroup.items.push({
        product,
        quantity: item.quantity,
        itemTotal,
      });
      vGroup.subtotal += itemTotal;
    }

    // 3. Coupon validation & discount calculation
    let discount = 0;
    let validatedCoupon: any = null;
    if (dto.couponCode) {
      try {
        validatedCoupon = await this.couponsService.validateCoupon(
          { code: dto.couponCode, cartSubtotal: subtotal },
          userId,
        );
        discount = validatedCoupon.discountAmount;
      } catch (err: any) {
        throw new BadRequestException(`Coupon error: ${err.message}`);
      }
    }

    // 4. Taxes & Shipping
    const tax = parseFloat(((subtotal - discount) * 0.05).toFixed(2));
    const shipping = 10.0;
    const total = parseFloat((subtotal - discount + tax + shipping).toFixed(2));

    // 5. Generate unique Order number
    const orderNumber = `MH-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Execute atomic database transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create main Order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax,
          shipping,
          discount,
          total,
          couponCode: dto.couponCode || null,
          shippingAddress: dto.shippingAddress as any,
          billingAddress: (dto.billingAddress || dto.shippingAddress) as any,
          notes: dto.notes || null,
        },
      });

      // Create Payment record (Mock payment completed)
      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          transactionId,
          paymentMethod: dto.paymentMethod || 'MOCK_PAYMENT',
          amount: total,
          currency: 'USD',
          status: PaymentRecordStatus.COMPLETED,
          paymentGatewayResponse: {
            mockSuccess: true,
            authCode: `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            processedAt: new Date().toISOString(),
          },
        },
      });

      // Create VendorOrders and OrderItems
      for (const [vendorId, vGroup] of vendorItemsMap.entries()) {
        const commRate = vGroup.vendor.commissionRate ?? this.defaultCommissionPercent;
        const commission = parseFloat(((vGroup.subtotal * commRate) / 100).toFixed(2));
        const netEarnings = parseFloat((vGroup.subtotal - commission).toFixed(2));

        const vendorOrder = await tx.vendorOrder.create({
          data: {
            orderId: createdOrder.id,
            vendorId,
            subtotal: parseFloat(vGroup.subtotal.toFixed(2)),
            commission,
            netEarnings,
            status: OrderStatus.CONFIRMED,
          },
        });

        for (const item of vGroup.items) {
          await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              vendorOrderId: vendorOrder.id,
              productId: item.product.id,
              productName: item.product.name,
              productSku: item.product.sku,
              productPrice: item.product.price,
              quantity: item.quantity,
              totalPrice: parseFloat(item.itemTotal.toFixed(2)),
            },
          });

          // Reduce stock atomically in transaction
          await this.inventoryService.reduceStock(item.product.id, item.quantity, tx);
        }

        // Send vendor notification
        await tx.notification.create({
          data: {
            userId: vGroup.vendor.userId,
            title: 'New Order Received',
            message: `You received a new order for ${vGroup.items.length} item(s) in Order #${orderNumber}.`,
            type: 'ORDER',
            link: '/vendor/dashboard',
          },
        });
      }

      // Record coupon usage
      if (validatedCoupon) {
        await tx.couponUsage.create({
          data: {
            couponId: validatedCoupon.couponId,
            userId,
            orderId: createdOrder.id,
            discountAmount: discount,
          },
        });

        await tx.coupon.update({
          where: { id: validatedCoupon.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear customer's Cart
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // Customer notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Order Confirmed',
          message: `Your order #${orderNumber} of $${total.toFixed(2)} has been successfully confirmed!`,
          type: 'ORDER',
          link: `/orders/${createdOrder.id}`,
        },
      });

      return createdOrder;
    });

    return this.getOrderById(order.id, { id: userId, role: Role.CUSTOMER });
  }

  async getCustomerOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
            vendorOrder: {
              select: {
                id: true,
                status: true,
                trackingNumber: true,
                vendor: { select: { id: true, storeName: true, slug: true } },
              },
            },
          },
        },
        vendorOrders: {
          include: {
            vendor: { select: { id: true, storeName: true, slug: true } },
          },
        },
        payment: true,
        deliveries: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, user: any) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
            vendorOrder: {
              include: {
                vendor: { select: { id: true, storeName: true, slug: true } },
              },
            },
          },
        },
        vendorOrders: {
          include: {
            vendor: { select: { id: true, storeName: true, slug: true } },
            orderItems: true,
          },
        },
        payment: true,
        deliveries: {
          include: {
            deliveryPartner: {
              include: {
                user: { select: { firstName: true, lastName: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Role-based visibility check
    if (user.role === Role.CUSTOMER && order.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to view this order');
    }

    if (user.role === Role.VENDOR) {
      const vendor = await this.prisma.vendor.findUnique({ where: { userId: user.id } });
      const hasVendorOrder = order.vendorOrders.some((vo) => vo.vendorId === vendor?.id);
      if (!hasVendorOrder && user.role !== Role.ADMIN) {
        throw new ForbiddenException('You do not have items in this order');
      }
    }

    return order;
  }

  async getVendorOrders(userId: string, filter?: { status?: OrderStatus; search?: string }) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const where: any = { vendorId: vendor.id };
    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.search) {
      where.order = {
        orderNumber: { contains: filter.search, mode: 'insensitive' },
      };
    }

    return this.prisma.vendorOrder.findMany({
      where,
      include: {
        order: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                images: { take: 1, orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateVendorOrderStatus(vendorOrderId: string, userId: string, dto: UpdateOrderStatusDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const vendorOrder = await this.prisma.vendorOrder.findFirst({
      where: { id: vendorOrderId, vendorId: vendor.id },
      include: {
        order: { include: { vendorOrders: true } },
        orderItems: true,
      },
    });

    if (!vendorOrder) {
      throw new NotFoundException('Vendor order not found or unauthorized');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update vendor order status
      const vo = await tx.vendorOrder.update({
        where: { id: vendorOrderId },
        data: {
          status: dto.status,
          trackingNumber: dto.trackingNumber || undefined,
        },
      });

      // If status is CANCELLED, restore inventory
      if (dto.status === OrderStatus.CANCELLED && vendorOrder.status !== OrderStatus.CANCELLED) {
        for (const item of vendorOrder.orderItems) {
          await this.inventoryService.restoreStock(item.productId, item.quantity, tx);
        }
      }

      // Check if all vendor orders in parent order have the same status
      const siblingOrders = await tx.vendorOrder.findMany({
        where: { orderId: vendorOrder.orderId },
      });

      const allDelivered = siblingOrders.every((o) => o.status === OrderStatus.DELIVERED);
      const allCancelled = siblingOrders.every((o) => o.status === OrderStatus.CANCELLED);

      if (allDelivered) {
        await tx.order.update({
          where: { id: vendorOrder.orderId },
          data: { status: OrderStatus.DELIVERED },
        });
      } else if (allCancelled) {
        await tx.order.update({
          where: { id: vendorOrder.orderId },
          data: { status: OrderStatus.CANCELLED },
        });
      } else {
        await tx.order.update({
          where: { id: vendorOrder.orderId },
          data: { status: dto.status },
        });
      }

      // Notify customer
      await tx.notification.create({
        data: {
          userId: vendorOrder.order.userId,
          title: `Order #${vendorOrder.order.orderNumber} Update`,
          message: `Your items from "${vendor.storeName}" have been updated to ${dto.status}.`,
          type: 'ORDER',
          link: `/orders/${vendorOrder.orderId}`,
        },
      });

      return vo;
    });

    return updated;
  }

  async getAllOrders(params: { status?: OrderStatus; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          vendorOrders: {
            include: { vendor: { select: { storeName: true } } },
          },
          payment: true,
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatusByAdmin(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await tx.vendorOrder.updateMany({
        where: { orderId },
        data: { status },
      });

      if (status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
        for (const item of order.orderItems) {
          await this.inventoryService.restoreStock(item.productId, item.quantity, tx);
        }
      }

      await tx.notification.create({
        data: {
          userId: order.userId,
          title: `Order Status Updated`,
          message: `Order #${order.orderNumber} status was updated to ${status}.`,
          type: 'ORDER',
          link: `/orders/${order.id}`,
        },
      });

      return updated;
    });
  }
}
