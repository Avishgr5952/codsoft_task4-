import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, VendorStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const [
      totalUsers,
      totalCustomers,
      totalVendors,
      totalDeliveryPartners,
      pendingVendors,
      totalProducts,
      totalOrders,
      pendingOrders,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.vendor.count(),
      this.prisma.deliveryPartner.count(),
      this.prisma.vendor.count({ where: { status: VendorStatus.PENDING } }),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    ]);

    // Financial calculations
    const allVendorOrders = await this.prisma.vendorOrder.findMany({
      where: { status: { not: OrderStatus.CANCELLED } },
      select: { subtotal: true, commission: true, netEarnings: true, createdAt: true },
    });

    const totalGrossSales = allVendorOrders.reduce((sum, vo) => sum + vo.subtotal, 0);
    const totalCommission = allVendorOrders.reduce((sum, vo) => sum + vo.commission, 0);
    const totalVendorPayouts = allVendorOrders.reduce((sum, vo) => sum + vo.netEarnings, 0);

    // Recent orders
    const recentOrders = await this.prisma.order.findMany({
      take: 6,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Recent vendors needing approval or newly onboarded
    const recentVendors = await this.prisma.vendor.findMany({
      take: 5,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 7-day revenue trend chart data
    const chartData: { date: string; grossSales: number; commission: number; ordersCount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayVendorOrders = allVendorOrders.filter((vo) => {
        return new Date(vo.createdAt).toISOString().split('T')[0] === dateStr;
      });

      const dayGross = dayVendorOrders.reduce((sum, vo) => sum + vo.subtotal, 0);
      const dayComm = dayVendorOrders.reduce((sum, vo) => sum + vo.commission, 0);

      chartData.push({
        date: dateStr,
        grossSales: parseFloat(dayGross.toFixed(2)),
        commission: parseFloat(dayComm.toFixed(2)),
        ordersCount: dayVendorOrders.length,
      });
    }

    return {
      metrics: {
        totalUsers,
        totalCustomers,
        totalVendors,
        totalDeliveryPartners,
        pendingVendors,
        totalProducts,
        totalOrders,
        pendingOrders,
        totalGrossSales: parseFloat(totalGrossSales.toFixed(2)),
        totalCommission: parseFloat(totalCommission.toFixed(2)),
        totalVendorPayouts: parseFloat(totalVendorPayouts.toFixed(2)),
      },
      chartData,
      recentOrders,
      recentVendors,
    };
  }

  async getPlatformSettings() {
    return this.prisma.platformSetting.findMany();
  }

  async updatePlatformSetting(key: string, value: string, description?: string) {
    return this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, value, description },
      update: { value, description: description || undefined },
    });
  }
}
