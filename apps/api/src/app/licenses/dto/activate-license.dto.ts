import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateLicenseDto {
  @ApiProperty({ 
    example: 'SAABIZ-XXXX-XXXX-XXXX', 
    description: 'The license key to activate' 
  })
  @IsString()
  @IsNotEmpty()
  licenseKey!: string;

  @ApiProperty({ 
    example: '8f8c8d8e-1234-5678-9abc-def012345678',
    description: 'Unique machine identifier (hardware fingerprint)' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  machineId!: string;

  @ApiProperty({ 
    example: 'acme-crm-pro',
    description: 'Product identifier for additional validation' 
  })
  @IsString()
  @IsNotEmpty()
  productId!: string;
}
