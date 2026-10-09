import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/create-coupon.dto';
import { Role, DiscountType } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateCoupon(dto: ValidateCouponDto, userId?: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase().trim() },
      include: { vendor: { select: { id: true, storeName: true } } },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (new Date(coupon.startDate) > now) {
      throw new BadRequestException('This coupon promotion has not started yet');
    }

    if (new Date(coupon.endDate) < now) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    if (dto.cartSubtotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`,
      );
    }

    if (userId) {
      const alreadyUsed = await this.prisma.couponUsage.findFirst({
        where: { couponId: coupon.id, userId },
      });
      if (alreadyUsed) {
        throw new BadRequestException('You have already redeemed this coupon');
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (dto.cartSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, dto.cartSubtotal);
    }

    discountAmount = parseFloat(discountAmount.toFixed(2));

    return {
      isValid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      vendor: coupon.vendor,
    };
  }

  async getVendorCoupons(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor profile not found');
    }

    return this.prisma.coupon.findMany({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(user: any, dto: CreateCouponDto) {
    let vendorId: string | null = null;

    if (user.role === Role.VENDOR) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { userId: user.id },
      });
      if (!vendor) {
        throw new ForbiddenException('Vendor profile not found');
      }
      vendorId = vendor.id;
    }

    const code = dto.code.toUpperCase().trim();
    const existing = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Coupon code '${code}' already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        code,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount ?? 0,
        maxDiscount: dto.maxDiscount ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: new Date(dto.endDate),
        usageLimit: dto.usageLimit ?? 100,
        isActive: dto.isActive ?? true,
        vendorId,
      },
    });
  }

  async toggleCouponStatus(id: string, user: any) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (user.role !== Role.ADMIN && coupon.vendor?.userId !== user.id) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }

  async deleteCoupon(id: string, user: any) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (user.role !== Role.ADMIN && coupon.vendor?.userId !== user.id) {
      throw new ForbiddenException('Not authorized');
    }

    return this.prisma.coupon.delete({ where: { id } });
  }
}
