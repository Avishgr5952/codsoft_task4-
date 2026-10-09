import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { DiscountType } from '@prisma/client';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      coupon: {
        findUnique: jest.fn(),
      },
      couponUsage: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCoupon', () => {
    it('should throw BadRequestException if coupon is not found or inactive', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);

      await expect(
        service.validateCoupon({ code: 'INVALID', cartSubtotal: 100 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if cart subtotal is less than minimum', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        id: 'c1',
        code: 'MIN100',
        isActive: true,
        startDate: new Date(Date.now() - 10000),
        endDate: new Date(Date.now() + 100000),
        usedCount: 0,
        usageLimit: 10,
        minOrderAmount: 100,
        discountType: DiscountType.FIXED,
        discountValue: 10,
      });

      await expect(
        service.validateCoupon({ code: 'MIN100', cartSubtotal: 50 }),
      ).rejects.toThrow('Minimum order amount');
    });

    it('should correctly calculate percentage discount with cap', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        id: 'c2',
        code: 'PERC20',
        isActive: true,
        startDate: new Date(Date.now() - 10000),
        endDate: new Date(Date.now() + 100000),
        usedCount: 0,
        usageLimit: 10,
        minOrderAmount: 50,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        maxDiscount: 15, // Cap at $15
      });

      const result = await service.validateCoupon({ code: 'PERC20', cartSubtotal: 100 });
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(15); // 20% of 100 is 20, but capped at 15
    });
  });
});
