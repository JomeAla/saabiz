import { IsNotEmpty, IsOptional, IsString, IsBoolean, Length } from 'class-validator';

export class CreateHoneypotDto {
  @IsNotEmpty()
  @IsString()
  productId!: string;

  @IsOptional()
  @IsString()
  @Length(3, 100)
  label?: string;

  @IsOptional()
  @IsString()
  @Length(6, 100)
  key?: string;
}

export class UpdateHoneypotDto {
  @IsOptional()
  @IsString()
  @Length(3, 100)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}