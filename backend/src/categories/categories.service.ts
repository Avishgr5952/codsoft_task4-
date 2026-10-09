import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CATEGORIES_CACHE_KEY = 'cache:categories:all';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(includeInactive = false) {
    if (!includeInactive) {
      const cached = await this.redis.get<any[]>(CATEGORIES_CACHE_KEY);
      if (cached) return cached;
    }

    const categories = await this.prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      include: {
        children: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (!includeInactive) {
      await this.redis.set(CATEGORIES_CACHE_KEY, categories, 600); // 10 minutes cache
    }

    return categories;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: true,
        parent: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    let slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: dto.name }, { slug }] },
    });

    if (existing) {
      throw new ConflictException('Category with this name or slug already exists');
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    await this.redis.del(CATEGORIES_CACHE_KEY);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.findById(id);

    let slug = existing.slug;
    if (dto.name && dto.name !== existing.name) {
      slug = dto.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const conflict = await this.prisma.category.findFirst({
        where: {
          id: { not: id },
          OR: [{ name: dto.name }, { slug }],
        },
      });
      if (conflict) {
        throw new ConflictException('Another category already has this name or slug');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug,
      },
    });

    await this.redis.del(CATEGORIES_CACHE_KEY);
    return updated;
  }

  async delete(id: string) {
    await this.findById(id);

    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${productCount} active products. Please reassign or delete products first.`,
      );
    }

    const deleted = await this.prisma.category.delete({
      where: { id },
    });

    await this.redis.del(CATEGORIES_CACHE_KEY);
    return deleted;
  }
}
