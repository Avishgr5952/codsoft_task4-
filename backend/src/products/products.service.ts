import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { Role, VendorStatus } from '@prisma/client';

const FEATURED_PRODUCTS_CACHE_KEY = 'cache:products:featured';
const DEALS_PRODUCTS_CACHE_KEY = 'cache:products:deals';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(filter: FilterProductDto) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter.limit) || 12));
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
      vendor: {
        status: VendorStatus.APPROVED,
      },
    };

    if (filter.search) {
      const q = filter.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { vendor: { storeName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (filter.category) {
      where.category = {
        OR: [{ id: filter.category }, { slug: filter.category }],
      };
    }

    if (filter.vendorId) {
      where.vendorId = filter.vendorId;
    }

    if (filter.vendorSlug) {
      where.vendor = { slug: filter.vendorSlug, status: VendorStatus.APPROVED };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) where.price.gte = Number(filter.minPrice);
      if (filter.maxPrice !== undefined) where.price.lte = Number(filter.maxPrice);
    }

    if (filter.minRating !== undefined) {
      where.averageRating = { gte: Number(filter.minRating) };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filter.sort === 'price_asc') orderBy = { price: 'asc' };
    else if (filter.sort === 'price_desc') orderBy = { price: 'desc' };
    else if (filter.sort === 'rating') orderBy = { averageRating: 'desc' };
    else if (filter.sort === 'popular') orderBy = { reviewCount: 'desc' };
    else if (filter.sort === 'newest') orderBy = { createdAt: 'desc' };

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
          vendor: { select: { id: true, storeName: true, slug: true, logoUrl: true } },
          inventory: { select: { availableQuantity: true, sku: true } },
        },
        orderBy,
      }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findFeatured() {
    const cached = await this.redis.get<any[]>(FEATURED_PRODUCTS_CACHE_KEY);
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: {
        isPublished: true,
        isFeatured: true,
        vendor: { status: VendorStatus.APPROVED },
      },
      take: 8,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        vendor: { select: { id: true, storeName: true, slug: true } },
        inventory: { select: { availableQuantity: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(FEATURED_PRODUCTS_CACHE_KEY, products, 300);
    return products;
  }

  async findDeals() {
    const cached = await this.redis.get<any[]>(DEALS_PRODUCTS_CACHE_KEY);
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: {
        isPublished: true,
        discount: { gt: 0 },
        vendor: { status: VendorStatus.APPROVED },
      },
      take: 8,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
        vendor: { select: { id: true, storeName: true, slug: true } },
        inventory: { select: { availableQuantity: true } },
      },
      orderBy: { discount: 'desc' },
    });

    await this.redis.set(DEALS_PRODUCTS_CACHE_KEY, products, 300);
    return products;
  }

  async findByIdOrSlug(identifier: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        vendor: {
          select: {
            id: true,
            storeName: true,
            slug: true,
            description: true,
            logoUrl: true,
            city: true,
            country: true,
          },
        },
        specifications: true,
        inventory: true,
        reviews: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product not found`);
    }

    return product;
  }

  async compare(ids: string[]) {
    if (!ids || ids.length === 0) {
      return [];
    }

    return this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        images: true,
        category: true,
        vendor: { select: { id: true, storeName: true, slug: true } },
        inventory: true,
        specifications: true,
      },
    });
  }

  async findVendorProducts(userId: string, filter?: { search?: string; page?: number; limit?: number }) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    const page = Math.max(1, Number(filter?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(filter?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { vendorId: vendor.id };
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          category: { select: { id: true, name: true } },
          inventory: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(user: any, dto: CreateProductDto) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: user.id },
    });

    if (!vendor) {
      throw new ForbiddenException('Only registered vendors can create products');
    }

    if (vendor.status !== VendorStatus.APPROVED && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        `Your store is currently ${vendor.status}. Products can only be created once your store is APPROVED by administrator.`,
      );
    }

    // Check SKU uniqueness
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku.trim() },
    });

    if (existingSku) {
      throw new ConflictException(`A product with SKU '${dto.sku}' already exists`);
    }

    // Generate unique slug
    let slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existingSlug = await this.prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const stock = dto.stock ?? 0;
    const lowStockThreshold = dto.lowStockThreshold ?? 5;

    const product = await this.prisma.product.create({
      data: {
        vendorId: vendor.id,
        categoryId: dto.categoryId,
        name: dto.name.trim(),
        slug,
        description: dto.description,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        discount: dto.discount ?? 0,
        sku: dto.sku.trim(),
        isPublished: dto.isPublished ?? true,
        isFeatured: dto.isFeatured ?? false,
        images: dto.images && dto.images.length > 0 ? {
          create: dto.images.map((img, index) => ({
            url: img.url,
            alt: img.alt || dto.name,
            isPrimary: img.isPrimary ?? index === 0,
            sortOrder: img.sortOrder ?? index,
          })),
        } : undefined,
        specifications: dto.specifications && dto.specifications.length > 0 ? {
          create: dto.specifications.map((spec) => ({
            key: spec.key,
            value: spec.value,
          })),
        } : undefined,
        inventory: {
          create: {
            sku: dto.sku.trim(),
            availableQuantity: stock,
            reservedQuantity: 0,
            soldQuantity: 0,
            lowStockThreshold,
          },
        },
      },
      include: {
        images: true,
        category: true,
        specifications: true,
        inventory: true,
      },
    });

    await this.invalidateCache();
    return product;
  }

  async update(id: string, user: any, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { vendor: true, inventory: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Strict ownership verification: Vendor A cannot edit Vendor B's products!
    if (user.role !== Role.ADMIN && product.vendor.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to modify this product');
    }

    if (dto.sku && dto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku.trim() },
      });
      if (existingSku && existingSku.id !== id) {
        throw new ConflictException(`SKU '${dto.sku}' is already taken`);
      }
    }

    // Update product & images/specifications/inventory
    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((img, index) => ({
              productId: id,
              url: img.url,
              alt: img.alt || product.name,
              isPrimary: img.isPrimary ?? index === 0,
              sortOrder: img.sortOrder ?? index,
            })),
          });
        }
      }

      if (dto.specifications) {
        await tx.productSpecification.deleteMany({ where: { productId: id } });
        if (dto.specifications.length > 0) {
          await tx.productSpecification.createMany({
            data: dto.specifications.map((s) => ({
              productId: id,
              key: s.key,
              value: s.value,
            })),
          });
        }
      }

      if (dto.stock !== undefined || dto.lowStockThreshold !== undefined || dto.sku !== undefined) {
        await tx.inventory.upsert({
          where: { productId: id },
          create: {
            productId: id,
            sku: dto.sku || product.sku,
            availableQuantity: dto.stock ?? 0,
            lowStockThreshold: dto.lowStockThreshold ?? 5,
          },
          update: {
            sku: dto.sku || undefined,
            availableQuantity: dto.stock !== undefined ? dto.stock : undefined,
            lowStockThreshold: dto.lowStockThreshold !== undefined ? dto.lowStockThreshold : undefined,
          },
        });
      }

      const { images, specifications, stock, lowStockThreshold, ...productData } = dto;

      return tx.product.update({
        where: { id },
        data: productData,
        include: {
          images: true,
          specifications: true,
          inventory: true,
          category: true,
        },
      });
    });

    await this.invalidateCache();
    return updated;
  }

  async delete(id: string, user: any) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Ownership check
    if (user.role !== Role.ADMIN && product.vendor.userId !== user.id) {
      throw new ForbiddenException('You are not authorized to delete this product');
    }

    const deleted = await this.prisma.product.delete({
      where: { id },
    });

    await this.invalidateCache();
    return deleted;
  }

  private async invalidateCache() {
    await this.redis.del(FEATURED_PRODUCTS_CACHE_KEY);
    await this.redis.del(DEALS_PRODUCTS_CACHE_KEY);
  }
}
