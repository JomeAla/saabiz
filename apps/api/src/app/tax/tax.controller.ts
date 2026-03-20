import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { TaxService } from './tax.service';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Get('rates')
  async getTaxRates() {
    return {
      countries: this.taxService.getSupportedCountries(),
    };
  }

  @Post('calculate')
  async calculateTax(
    @Body() body: { amount: number; countryCode: string }
  ) {
    return this.taxService.calculateTax(body.amount, body.countryCode);
  }

  @Get('calculate')
  async calculateTaxByQuery(
    @Query('amount') amount: string,
    @Query('countryCode') countryCode: string
  ) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return { error: 'Invalid amount' };
    }
    return this.taxService.calculateTax(numAmount, countryCode || 'US');
  }
}
