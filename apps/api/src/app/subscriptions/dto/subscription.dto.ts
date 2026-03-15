import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CancelSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  subscriptionId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpgradeSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  subscriptionId!: string;

  @IsString()
  @IsNotEmpty()
  newPlanId!: string;
}
