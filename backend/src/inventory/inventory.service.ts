import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Role } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getVendorInventory(userId: string, filter?: { lowStockOnly?: boolean; search?: string }) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const where: any = {
      product: {
        vendorId: vendor.id,
      },
    };

    if (filter?.search) {
      where.OR = [
        { sku: { contains: filter.search, mode: 'insensitive' } },
        { product: { name: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    const inventoryItems = await this.prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            isPublished: true,
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = inventoryItems.map((item) => {
      let status = 'IN_STOCK';
      if (item.availableQuantity === 0) {
        status = 'OUT_OF_STOCK';
      } else if (item.availableQuantity <= item.lowStockThreshold) {
        status = 'LOW_STOCK';
      }

      return {
        ...item,
        status,
      };
    });

    if (filter?.lowStockOnly) {
      return enriched.filter((i) => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK');
    }

    return enriched;
  }

  async updateProductInventory(
    productId: string,
    user: any,
    dto: UpdateInventoryDto,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true, inventory: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (user.role !== Role.ADMIN && product.vendor.userId !== user.id) {
      throw new ForbiddenException('You do not own this product');
    }

    const updated = await this.prisma.inventory.upsert({
      where: { productId },
      create: {
        productId,
        sku: product.sku,
        availableQuantity: dto.availableQuantity ?? 0,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
      },
      update: {
        availableQuantity: dto.availableQuantity !== undefined ? dto.availableQuantity : undefined,
        lowStockThreshold: dto.lowStockThreshold !== undefined ? dto.lowStockThreshold : undefined,
      },
    });

    // If low stock, create notification
    if (updated.availableQuantity <= updated.lowStockThreshold) {
      await this.prisma.notification.create({
        data: {
          userId: product.vendor.userId,
          title: 'Low Stock Alert',
          message: `Product "${product.name}" is low on stock (${updated.availableQuantity} remaining).`,
          type: 'INVENTORY',
          link: '/vendor/dashboard',
        },
      });
    }

    return updated;
  }

  async reduceStock(productId: string, quantity: number, tx?: any) {
    const prisma = tx || this.prisma;

    const inventory = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: true },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory record not found for product ID ${productId}`);
    }

    if (inventory.availableQuantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for "${inventory.product.name}". Requested: ${quantity}, Available: ${inventory.availableQuantity}`,
      );
    }

    const updated = await prisma.inventory.update({
      where: { productId },
      data: {
        availableQuantity: { decrement: quantity },
        soldQuantity: { increment: quantity },
      },
      include: { product: { include: { vendor: true } } },
    });

    if (updated.availableQuantity <= updated.lowStockThreshold) {
      await prisma.notification.create({
        data: {
          userId: updated.product.vendor.userId,
          title: 'Low Stock Alert',
          message: `Product "${updated.product.name}" reached low stock (${updated.availableQuantity} remaining).`,
          type: 'INVENTORY',
          link: '/vendor/dashboard',
        },
      });
    }

    return updated;
  }

  async restoreStock(productId: string, quantity: number, tx?: any) {
    const prisma = tx || this.prisma;

    return prisma.inventory.update({
      where: { productId },
      data: {
        availableQuantity: { increment: quantity },
        soldQuantity: { decrement: Math.max(0, quantity) },
      },
    });
  }
}
