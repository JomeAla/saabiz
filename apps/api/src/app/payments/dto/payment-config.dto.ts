import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdatePaymentConfigDto {
  @IsOptional()
  @IsString()
  paystackPublicKey?: string;

  @IsOptional()
  @IsString()
  paystackSecretKey?: string;

  @IsOptional()
  @IsBoolean()
  paystackActive?: boolean;

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
  @IsBoolean()
  flutterwaveActive?: boolean;

  @IsOptional()
  @IsString()
  stripePublicKey?: string;

  @IsOptional()
  @IsString()
  stripeSecretKey?: string;

  @IsOptional()
  @IsBoolean()
  stripeActive?: boolean;

  @IsOptional()
  @IsString()
  webhookSecret?: string;
}
