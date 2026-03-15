import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateLicenseDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  productId: string;
}
