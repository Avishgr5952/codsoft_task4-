import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number = 1;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}
