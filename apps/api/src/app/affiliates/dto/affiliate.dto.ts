import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateAffiliateLinkDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;
}

export class UpdateAffiliateProfileDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;
}

export class TrackConversionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  transactionId!: string;
}
