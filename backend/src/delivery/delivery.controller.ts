import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { UpdateDeliveryStatusDto, AssignDeliveryDto } from './dto/update-delivery-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('delivery')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('dashboard')
  @Roles(Role.DELIVERY_PARTNER, Role.ADMIN)
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.deliveryService.getPartnerDeliveries(userId);
  }

  @Patch('deliveries/:id/status')
  @Roles(Role.DELIVERY_PARTNER, Role.ADMIN)
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') deliveryId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateDeliveryStatus(deliveryId, userId, dto);
  }

  @Post('assign')
  @Roles(Role.ADMIN)
  async assignDelivery(@Body() dto: AssignDeliveryDto) {
    return this.deliveryService.assignDelivery(dto);
  }

  @Get('partners')
  @Roles(Role.ADMIN)
  async getAllPartners() {
    return this.deliveryService.getAllPartners();
  }
}
