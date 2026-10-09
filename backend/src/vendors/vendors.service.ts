import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found for this user');
    }

    return vendor;
  }

  async findById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { products: true, vendorOrders: true },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async findBySlug(slug: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isPublished: true },
          include: {
            images: true,
            category: true,
            inventory: true,
          },
        },
        _count: {
          select: { products: true, vendorOrders: true },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Store not found');
    }

    return vendor;
  }

  async updateProfile(userId: string, dto: UpdateVendorDto) {
    const vendor = await this.findByUserId(userId);

    let slug = vendor.slug;
    if (dto.storeName && dto.storeName !== vendor.storeName) {
      slug = dto.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existing = await this.prisma.vendor.findFirst({
        where: {
          id: { not: vendor.id },
          OR: [{ storeName: dto.storeName }, { slug }],
        },
      });
      if (existing) {
        throw new ConflictException('A store with this name already exists');
      }
    }

    return this.prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        ...dto,
        slug,
      },
    });
  }

  async getDashboardAnalytics(userId: string) {
    const vendor = await this.findByUserId(userId);

    // Total products & low-stock products
    const [totalProducts, lowStockProducts] = await Promise.all([
      this.prisma.product.count({ where: { vendorId: vendor.id } }),
      this.prisma.inventory.count({
        where: {
          product: { vendorId: vendor.id },
          availableQuantity: { lte: 5 },
        },
      }),
    ]);

    // Vendor orders
    const vendorOrders = await this.prisma.vendorOrder.findMany({
      where: { vendorId: vendor.id },
      include: {
        order: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        orderItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalOrders = vendorOrders.length;
    const completedOrdersList = vendorOrders.filter((o) => o.status === OrderStatus.DELIVERED);
    const pendingOrdersList = vendorOrders.filter((o) => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);

    const grossSales = vendorOrders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.subtotal, 0);

    const totalCommission = vendorOrders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.commission, 0);

    const netEarnings = vendorOrders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.netEarnings, 0);

    const completedEarnings = completedOrdersList.reduce((sum, o) => sum + o.netEarnings, 0);
    const pendingEarnings = pendingOrdersList.reduce((sum, o) => sum + o.netEarnings, 0);

    // Recent 5 orders
    const recentOrders = vendorOrders.slice(0, 5).map((vo) => ({
      id: vo.id,
      orderNumber: vo.order.orderNumber,
      customerName: `${vo.order.user.firstName} ${vo.order.user.lastName}`,
      customerEmail: vo.order.user.email,
      itemsCount: vo.orderItems.length,
      subtotal: vo.subtotal,
      netEarnings: vo.netEarnings,
      status: vo.status,
      createdAt: vo.createdAt,
    }));

    // Top selling products for this vendor
    const productSalesMap = new Map<string, { id: string; name: string; sold: number; revenue: number }>();
    for (const vo of vendorOrders) {
      if (vo.status !== OrderStatus.CANCELLED) {
        for (const item of vo.orderItems) {
          const current = productSalesMap.get(item.productId) || {
            id: item.productId,
            name: item.productName,
            sold: 0,
            revenue: 0,
          };
          current.sold += item.quantity;
          current.revenue += item.totalPrice;
          productSalesMap.set(item.productId, current);
        }
      }
    }
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Sales over the last 7 days for charts
    const chartData: { date: string; sales: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayOrders = vendorOrders.filter((vo) => {
        const orderDateStr = new Date(vo.createdAt).toISOString().split('T')[0];
        return orderDateStr === dateStr && vo.status !== OrderStatus.CANCELLED;
      });

      const daySales = dayOrders.reduce((sum, o) => sum + o.netEarnings, 0);
      chartData.push({
        date: dateStr,
        sales: parseFloat(daySales.toFixed(2)),
        orders: dayOrders.length,
      });
    }

    return {
      storeName: vendor.storeName,
      status: vendor.status,
      commissionRate: vendor.commissionRate,
      metrics: {
        grossSales: parseFloat(grossSales.toFixed(2)),
        platformCommission: parseFloat(totalCommission.toFixed(2)),
        netEarnings: parseFloat(netEarnings.toFixed(2)),
        completedEarnings: parseFloat(completedEarnings.toFixed(2)),
        pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
        totalOrders,
        completedOrders: completedOrdersList.length,
        pendingOrders: pendingOrdersList.length,
        totalProducts,
        lowStockProducts,
      },
      chartData,
      recentOrders,
      topProducts,
    };
  }

  async findAll(params: { status?: VendorStatus; search?: string; page?: number; limit?: number }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { storeName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [total, vendors] = await Promise.all([
      this.prisma.vendor.count({ where }),
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: {
            select: { products: true, vendorOrders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      vendors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(id: string, status: VendorStatus) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: { status },
    });

    // Create notification for vendor
    await this.prisma.notification.create({
      data: {
        userId: vendor.userId,
        title: `Vendor Account ${status}`,
        message: `Your store status has been updated to ${status} by administrator.`,
        type: 'VENDOR',
        link: '/vendor/dashboard',
      },
    });

    return updated;
  }
}
