import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateInventoryDto {
  @IsInt()
  @Min(0, { message: 'Available quantity cannot be negative' })
  @IsOptional()
  availableQuantity?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number;
}
