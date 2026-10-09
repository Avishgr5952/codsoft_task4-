import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  async getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('eligibility/:productId')
  async checkEligibility(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.reviewsService.checkEligibility(userId, productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateReview(
    @CurrentUser('id') userId: string,
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(userId, reviewId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteReview(
    @CurrentUser() user: any,
    @Param('id') reviewId: string,
  ) {
    return this.reviewsService.deleteReview(user.id, reviewId, user.role);
  }
}
