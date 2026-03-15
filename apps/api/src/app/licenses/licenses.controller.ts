import { Controller, Post, Body } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { ValidateLicenseDto } from './dto/validate-license.dto';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Post('verify')
  async verifyLicense(@Body() dto: ValidateLicenseDto) {
    return this.licensesService.validateLicense(dto);
  }
}
