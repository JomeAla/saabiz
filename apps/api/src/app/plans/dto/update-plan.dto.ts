import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Interval } from '@prisma/client';

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsEnum(Interval)
  @IsOptional()
  interval?: Interval;
}
