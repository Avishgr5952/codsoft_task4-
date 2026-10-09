import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string = 'MOCK_CARD';

  // Structured for future Stripe/Razorpay tokens (e.g. stripePaymentMethodId, razorpayPaymentId)
  @IsString()
  @IsOptional()
  gatewayToken?: string;
}
