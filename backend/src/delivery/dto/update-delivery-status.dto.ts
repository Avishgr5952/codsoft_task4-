import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeliveryStatus } from '@prisma/client';

export class UpdateDeliveryStatusDto {
  @IsEnum(DeliveryStatus)
  @IsNotEmpty()
  status: DeliveryStatus;

  @IsString()
  @IsOptional()
  deliveryNotes?: string;
}

export class AssignDeliveryDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  deliveryPartnerId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
