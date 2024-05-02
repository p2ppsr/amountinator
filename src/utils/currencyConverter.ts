import { CwiExternalServices } from 'cwi-external-services';
const EXCHANGE_RATE_UPDATE_INTERVAL = 5 * 60 * 1000
// currencyConverter.ts


class CurrencyConverter {
  private rates: { [key: string]: number } = {};
  private services: CwiExternalServices;

  constructor() {
    this.services = new CwiExternalServices(CwiExternalServices.createDefaultOptions());
    this.updateRates();
    setInterval(() => this.updateRates(), 5 * 60 * 1000);  // Update every 5 minutes
  }

  async updateRates() {
    try {
      // Assuming getBsvExchangeRate returns the number of SATS per USD
      const usdToSatsRate = await this.services.getBsvExchangeRate();
      this.rates['USD_SATS'] = usdToSatsRate;
      this.rates['USD_USD'] = 1;  // Direct conversion for USD to USD should always be 1

      // Ensure that we are correctly setting these rates based on how your API returns them
      // If you also need EUR to USD and GBP to USD:
      const eurToUsdRate = await this.services.getFiatExchangeRate('EUR');
      this.rates['EUR_USD'] = eurToUsdRate;
      const gbpToUsdRate = await this.services.getFiatExchangeRate('GBP');
      this.rates['GBP_USD'] = gbpToUsdRate;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
    }
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    const key = `${fromCurrency}_${toCurrency}`;
    const rate = this.rates[key];
    if (rate === undefined) {
      console.error('Exchange rate not available for', key);
      return 0;  // Consider throwing an error or handling this case more gracefully
    }
    return amount * rate;
  }
}

export const currencyConverter = new CurrencyConverter();
