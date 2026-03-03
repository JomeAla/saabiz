import { IsOptional, IsString } from 'class-validator';

export class UpdatePaymentConfigDto {
  @IsOptional()
  @IsString()
  paystackPublicKey?: string;

  @IsOptional()
  @IsString()
  paystackSecretKey?: string;

  @IsOptional()
  @IsString()
  flutterwavePublicKey?: string;

  @IsOptional()
  @IsString()
  flutterwaveSecretKey?: string;

  @IsOptional()
  @IsString()
  flutterwaveEncryptionKey?: string;

  @IsOptional()
  @IsString()
  stripePublicKey?: string;

  @IsOptional()
  @IsString()
  stripeSecretKey?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
