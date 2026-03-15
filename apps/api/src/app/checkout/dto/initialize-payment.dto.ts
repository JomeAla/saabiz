import { IsEmail, IsNumber, IsString, IsOptional, IsIn } from 'class-validator';

export class InitializePaymentDto {
  @IsEmail()
  email!: string;

  @IsString()
  productId!: string;

  @IsString()
  planId!: string;

  @IsString()
  @IsIn(['paystack', 'flutterwave', 'stripe'])
  gateway!: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  refCode?: string;
}
