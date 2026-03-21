import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeactivateLicenseDto {
  @ApiProperty({ 
    example: 'SAABIZ-XXXX-XXXX-XXXX', 
    description: 'The license key to deactivate' 
  })
  @IsString()
  @IsNotEmpty()
  licenseKey!: string;

  @ApiProperty({ 
    example: '8f8c8d8e-1234-5678-9abc-def012345678',
    description: 'Machine ID to deactivate' 
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  machineId!: string;

  @ApiProperty({ 
    example: 'acme-crm-pro',
    description: 'Product identifier' 
  })
  @IsString()
  @IsNotEmpty()
  productId!: string;
}
