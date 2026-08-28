import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsNumber, IsEnum, IsEmail, IsDate, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

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

// User Management DTOs
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsEnum(['ADMIN', 'SELLER', 'CUSTOMER', 'AFFILIATE'])
  @IsNotEmpty()
  role!: 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'AFFILIATE';

  @IsString()
  @IsOptional()
  businessName?: string;

  @IsBoolean()
  @IsOptional()
  skipVerification?: boolean;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  payoutEmail?: string;

  @IsString()
  @IsOptional()
  payoutGateway?: string;
}

// Promotion DTOs
export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['PERCENTAGE', 'FIXED'])
  @IsNotEmpty()
  discountType!: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  discountValue!: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  maxUses?: number;
}

export class UpdatePromotionDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  maxUses?: number;
}

// Subscription Management DTOs
export class UpgradeSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  subscriptionId!: string;

  @IsString()
  @IsNotEmpty()
  newPlanId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

// Tenant Management DTOs
export class TenantSettingsDto {
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  tagline?: string;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsOptional()
  primaryDomain?: string;

  @IsOptional()
  settings?: TenantSettingsDto;

  @IsString()
  @IsOptional()
  assignSellerId?: string;
}

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  settings?: TenantSettingsDto;
}

export class AddDomainDto {
  @IsString()
  @IsNotEmpty()
  host!: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
