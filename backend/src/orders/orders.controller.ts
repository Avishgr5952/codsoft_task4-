import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, OrderStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, dto);
  }

  @Get()
  async getMyOrders(@CurrentUser('id') userId: string) {
    return this.ordersService.getCustomerOrders(userId);
  }

  @Get('vendor')
  @Roles(Role.VENDOR, Role.ADMIN)
  async getVendorOrders(
    @CurrentUser('id') userId: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ) {
    return this.ordersService.getVendorOrders(userId, { status, search });
  }

  @Patch('vendor/:vendorOrderId/status')
  @Roles(Role.VENDOR, Role.ADMIN)
  async updateVendorOrderStatus(
    @CurrentUser('id') userId: string,
    @Param('vendorOrderId') vendorOrderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateVendorOrderStatus(vendorOrderId, userId, dto);
  }

  @Get('admin/all')
  @Roles(Role.ADMIN)
  async getAllOrders(
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.getAllOrders({ status, search, page, limit });
  }

  @Patch('admin/:orderId/status')
  @Roles(Role.ADMIN)
  async updateOrderStatusByAdmin(
    @Param('orderId') orderId: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateOrderStatusByAdmin(orderId, status);
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getOrderById(id, user);
  }
}
