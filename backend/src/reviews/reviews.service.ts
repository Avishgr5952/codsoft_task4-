import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkEligibility(userId: string, productId: string) {
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          paymentStatus: PaymentStatus.PAID,
        },
      },
    });

    const existingReview = await this.prisma.review.findUnique({
      where: {
        productId_userId: { productId, userId },
      },
    });

    return {
      canReview: Boolean(purchased),
      alreadyReviewed: Boolean(existingReview),
      existingReview,
    };
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    const eligibility = await this.checkEligibility(userId, dto.productId);

    if (!eligibility.canReview) {
      throw new ForbiddenException(
        'Only customers who have purchased this product can leave a verified review',
      );
    }

    if (eligibility.alreadyReviewed) {
      throw new ConflictException('You have already reviewed this product. You can update your existing review.');
    }

    const review = await this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
        isVerifiedPurchase: true,
      },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await this.recalculateProductRating(dto.productId);

    return review;
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('You are not authorized to update this review');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: dto,
    });

    await this.recalculateProductRating(review.productId);

    return updated;
  }

  async deleteReview(userId: string, reviewId: string, userRole: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (userRole !== 'ADMIN' && review.userId !== userId) {
      throw new ForbiddenException('Not authorized to delete this review');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    await this.recalculateProductRating(review.productId);

    return { success: true, message: 'Review deleted successfully' };
  }

  private async recalculateProductRating(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = agg._avg.rating ? parseFloat(agg._avg.rating.toFixed(1)) : 0.0;
    const reviewCount = agg._count.rating || 0;

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating,
        reviewCount,
      },
    });
  }
}
