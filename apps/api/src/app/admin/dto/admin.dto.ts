import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class FreezeProductDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsBoolean()
  @IsNotEmpty()
  freeze!: boolean;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdatePayoutDto {
  @IsString()
  @IsNotEmpty()
  sellerId!: string;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsEnum(['approve', 'process', 'reject'])
  action!: 'approve' | 'process' | 'reject';
}
