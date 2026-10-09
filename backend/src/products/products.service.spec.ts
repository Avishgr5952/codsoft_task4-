import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, VendorStatus } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;
  let redis: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      vendor: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create product authorization', () => {
    it('should throw ForbiddenException if vendor is not approved', async () => {
      prisma.vendor.findUnique.mockResolvedValue({
        id: 'v1',
        status: VendorStatus.PENDING,
      });

      await expect(
        service.create(
          { id: 'user-1', role: Role.VENDOR },
          {
            name: 'New Product',
            categoryId: 'cat-1',
            description: 'Desc',
            price: 50,
            sku: 'SKU-001',
          },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete product vendor isolation', () => {
    it('should prevent Vendor A from deleting Vendor B product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        vendor: { userId: 'vendor-b-user' },
      });

      await expect(
        service.delete('prod-1', { id: 'vendor-a-user', role: Role.VENDOR }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to delete any vendor product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        vendor: { userId: 'vendor-b-user' },
      });
      prisma.product.delete.mockResolvedValue({ id: 'prod-1' });

      const res = await service.delete('prod-1', { id: 'admin-user', role: Role.ADMIN });
      expect(res).toHaveProperty('id', 'prod-1');
    });
  });
});
