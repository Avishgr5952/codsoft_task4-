import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('vendor')
  @Roles(Role.VENDOR, Role.ADMIN)
  async getVendorInventory(
    @CurrentUser('id') userId: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getVendorInventory(userId, {
      lowStockOnly: lowStockOnly === 'true',
      search,
    });
  }

  @Patch(':productId')
  @Roles(Role.VENDOR, Role.ADMIN)
  async updateInventory(
    @Param('productId') productId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateProductInventory(productId, user, dto);
  }
}
