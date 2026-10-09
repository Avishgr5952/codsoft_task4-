import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/add-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { sortOrder: 'asc' } },
            vendor: {
              select: { id: true, storeName: true, slug: true },
            },
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group items by vendor
    const vendorMap = new Map<string, {
      vendorId: string;
      storeName: string;
      slug: string;
      items: any[];
      subtotal: number;
    }>();

    let subtotal = 0;
    let totalItems = 0;

    for (const item of items) {
      const v = item.product.vendor;
      const availableStock = item.product.inventory?.availableQuantity ?? 0;
      const isAvailable = availableStock >= item.quantity && item.product.isPublished;

      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      const enrichedItem = {
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.sku,
        price: item.product.price,
        compareAtPrice: item.product.compareAtPrice,
        discount: item.product.discount,
        image: item.product.images[0]?.url || null,
        quantity: item.quantity,
        availableStock,
        isAvailable,
        totalPrice: parseFloat(itemTotal.toFixed(2)),
      };

      if (!vendorMap.has(v.id)) {
        vendorMap.set(v.id, {
          vendorId: v.id,
          storeName: v.storeName,
          slug: v.slug,
          items: [],
          subtotal: 0,
        });
      }

      const group = vendorMap.get(v.id)!;
      group.items.push(enrichedItem);
      group.subtotal = parseFloat((group.subtotal + itemTotal).toFixed(2));
    }

    const vendorGroups = Array.from(vendorMap.values());
    const tax = parseFloat((subtotal * 0.05).toFixed(2)); // 5% tax
    // Shipping: $10 flat if cart has items, otherwise $0
    const shipping = items.length > 0 ? 10.0 : 0.0;
    const grandTotal = parseFloat((subtotal + tax + shipping).toFixed(2));

    return {
      cartId: cart.id,
      itemsCount: totalItems,
      vendorGroups,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax,
        shipping,
        grandTotal,
        totalItems,
      },
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { inventory: true },
    });

    if (!product || !product.isPublished) {
      throw new NotFoundException('Product not found or unavailable');
    }

    const availableStock = product.inventory?.availableQuantity ?? 0;
    if (availableStock < dto.quantity) {
      throw new BadRequestException(
        `Only ${availableStock} units available in stock for this product`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      if (availableStock < newQty) {
        throw new BadRequestException(
          `Cannot add more. Max stock available is ${availableStock}`,
        );
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItemQuantity(userId: string, cartItemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
      include: { product: { include: { inventory: true } } },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const availableStock = cartItem.product.inventory?.availableQuantity ?? 0;
    if (dto.quantity > availableStock) {
      throw new BadRequestException(`Only ${availableStock} items available in stock`);
    }

    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: dto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, cartItemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return { success: true, message: 'Cart cleared successfully' };
  }
}
