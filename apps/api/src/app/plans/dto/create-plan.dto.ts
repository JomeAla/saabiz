import { IsString, IsNumber, IsEnum, IsUUID } from 'class-validator';
import { Interval } from '@prisma/client';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsEnum(Interval)
  interval!: Interval;

  @IsUUID()
  productId!: string;
}
