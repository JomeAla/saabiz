import { Injectable } from '@nestjs/common';

interface TaxRate {
  country: string;
  countryCode: string;
  rate: number;
  name: string;
}

interface TaxCalculationResult {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  country: string;
  taxName: string;
}

@Injectable()
export class TaxService {
  private readonly taxRates: TaxRate[] = [
    // Africa - Prioritized
    { country: 'Nigeria', countryCode: 'NG', rate: 0.075, name: 'VAT' },
    { country: 'Ghana', countryCode: 'GH', rate: 0.15, name: 'VAT' },
    { country: 'Kenya', countryCode: 'KE', rate: 0.16, name: 'VAT' },
    { country: 'South Africa', countryCode: 'ZA', rate: 0.15, name: 'VAT' },
    { country: 'Egypt', countryCode: 'EG', rate: 0.14, name: 'VAT' },
    { country: 'Morocco', countryCode: 'MA', rate: 0.20, name: 'VAT' },
    { country: 'Ethiopia', countryCode: 'ET', rate: 0.15, name: 'VAT' },
    { country: 'Tanzania', countryCode: 'TZ', rate: 0.18, name: 'VAT' },
    { country: 'Uganda', countryCode: 'UG', rate: 0.18, name: 'VAT' },
    { country: 'Rwanda', countryCode: 'RW', rate: 0.18, name: 'VAT' },
    { country: 'Senegal', countryCode: 'SN', rate: 0.18, name: 'VAT' },
    { country: 'Ivory Coast', countryCode: 'CI', rate: 0.18, name: 'VAT' },
    { country: 'Cameroon', countryCode: 'CM', rate: 0.1925, name: 'VAT' },
    { country: 'Algeria', countryCode: 'DZ', rate: 0.19, name: 'VAT' },
    { country: 'Tunisia', countryCode: 'TN', rate: 0.19, name: 'VAT' },
    { country: 'Zambia', countryCode: 'ZM', rate: 0.16, name: 'VAT' },
    { country: 'Zimbabwe', countryCode: 'ZW', rate: 0.145, name: 'VAT' },
    { country: 'Mozambique', countryCode: 'MZ', rate: 0.17, name: 'VAT' },
    { country: 'Angola', countryCode: 'AO', rate: 0.14, name: 'VAT' },
    { country: 'DR Congo', countryCode: 'CD', rate: 0.16, name: 'VAT' },
    // UK & Europe
    { country: 'United Kingdom', countryCode: 'GB', rate: 0.20, name: 'VAT' },
    { country: 'Germany', countryCode: 'DE', rate: 0.19, name: 'VAT' },
    { country: 'France', countryCode: 'FR', rate: 0.20, name: 'VAT' },
    { country: 'Spain', countryCode: 'ES', rate: 0.21, name: 'VAT' },
    { country: 'Italy', countryCode: 'IT', rate: 0.22, name: 'VAT' },
    { country: 'Netherlands', countryCode: 'NL', rate: 0.21, name: 'VAT' },
    { country: 'Belgium', countryCode: 'BE', rate: 0.21, name: 'VAT' },
    { country: 'Austria', countryCode: 'AT', rate: 0.20, name: 'VAT' },
    { country: 'Poland', countryCode: 'PL', rate: 0.23, name: 'VAT' },
    { country: 'Sweden', countryCode: 'SE', rate: 0.25, name: 'VAT' },
    { country: 'Denmark', countryCode: 'DK', rate: 0.25, name: 'VAT' },
    { country: 'Finland', countryCode: 'FI', rate: 0.24, name: 'VAT' },
    { country: 'Norway', countryCode: 'NO', rate: 0.25, name: 'VAT' },
    { country: 'Ireland', countryCode: 'IE', rate: 0.23, name: 'VAT' },
    { country: 'Portugal', countryCode: 'PT', rate: 0.23, name: 'VAT' },
    { country: 'Greece', countryCode: 'GR', rate: 0.24, name: 'VAT' },
    { country: 'Czech Republic', countryCode: 'CZ', rate: 0.21, name: 'VAT' },
    { country: 'Romania', countryCode: 'RO', rate: 0.19, name: 'VAT' },
    { country: 'Hungary', countryCode: 'HU', rate: 0.27, name: 'VAT' },
    // Americas
    { country: 'United States', countryCode: 'US', rate: 0, name: 'Sales Tax (varies by state)' },
    { country: 'Canada', countryCode: 'CA', rate: 0.05, name: 'GST' },
    { country: 'Brazil', countryCode: 'BR', rate: 0.17, name: 'ICMS' },
    { country: 'Mexico', countryCode: 'MX', rate: 0.16, name: 'IVA' },
    // Asia Pacific
    { country: 'Australia', countryCode: 'AU', rate: 0.10, name: 'GST' },
    { country: 'New Zealand', countryCode: 'NZ', rate: 0.15, name: 'GST' },
    { country: 'Singapore', countryCode: 'SG', rate: 0.09, name: 'GST' },
    { country: 'Japan', countryCode: 'JP', rate: 0.10, name: 'Consumption Tax' },
    { country: 'India', countryCode: 'IN', rate: 0.18, name: 'GST' },
  ];

  async calculateTax(amount: number, countryCode: string): Promise<TaxCalculationResult> {
    const taxRate = this.taxRates.find(
      t => t.countryCode.toUpperCase() === countryCode.toUpperCase()
    );

    if (!taxRate) {
      return {
        subtotal: amount,
        taxAmount: 0,
        total: amount,
        taxRate: 0,
        country: 'Unknown',
        taxName: 'No tax',
      };
    }

    const taxAmount = amount * taxRate.rate;
    const total = amount + taxAmount;

    return {
      subtotal: Math.round(amount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      taxRate: taxRate.rate,
      country: taxRate.country,
      taxName: taxRate.name,
    };
  }

  async calculateTaxByCountryName(amount: number, countryName: string): Promise<TaxCalculationResult> {
    const taxRate = this.taxRates.find(
      t => t.country.toLowerCase() === countryName.toLowerCase()
    );

    if (!taxRate) {
      return {
        subtotal: amount,
        taxAmount: 0,
        total: amount,
        taxRate: 0,
        country: 'Unknown',
        taxName: 'No tax',
      };
    }

    const taxAmount = amount * taxRate.rate;
    const total = amount + taxAmount;

    return {
      subtotal: Math.round(amount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      taxRate: taxRate.rate,
      country: taxRate.country,
      taxName: taxRate.name,
    };
  }

  getSupportedCountries(): { country: string; countryCode: string; rate: number; name: string }[] {
    return this.taxRates.map(t => ({
      country: t.country,
      countryCode: t.countryCode,
      rate: t.rate,
      name: t.name,
    }));
  }

  isTaxable(countryCode: string): boolean {
    const taxRate = this.taxRates.find(
      t => t.countryCode.toUpperCase() === countryCode.toUpperCase()
    );
    return taxRate ? taxRate.rate > 0 : false;
  }
}
