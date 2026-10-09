import { IsEnum, IsNotEmpty } from 'class-validator';
import { VendorStatus } from '@prisma/client';

export class UpdateVendorStatusDto {
  @IsEnum(VendorStatus, { message: 'Status must be PENDING, APPROVED, REJECTED, or SUSPENDED' })
  @IsNotEmpty()
  status: VendorStatus;
}
