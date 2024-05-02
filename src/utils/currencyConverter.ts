import { getPreferredCurrency } from '@babbage/sdk-ts';
import { CwiExternalServices } from 'cwi-external-services';
import { formatAmountWithCurrency } from './amountFormatHelpers';
const EXCHANGE_RATE_UPDATE_INTERVAL = 5 * 60 * 1000

interface ExchangeRates {
  usdPerBsv: number
  gbpPerUsd: number
  eurPerUsd: number
}

interface FormatOptions {
  decimalPlaces?: number
  useCommas?: boolean
  useUnderscores?: boolean
}

class CurrencyConverter {
  public exchangeRates: ExchangeRates
  public preferredCurrency: string
  private services: CwiExternalServices;

  constructor() {
    this.services = new CwiExternalServices(CwiExternalServices.createDefaultOptions())
    this.exchangeRates = { usdPerBsv: 0, gbpPerUsd: 0, eurPerUsd: 0 }
    this.preferredCurrency = 'USD'
  }

  async initialize(): Promise<void> {
    await this.fetchExchangeRates();
    this.preferredCurrency = await getPreferredCurrency({})
    // Start a timer to update rates periodically
    setInterval(() => this.fetchExchangeRates(), EXCHANGE_RATE_UPDATE_INTERVAL);
  }

  getCurrencySymbol() {
    const symbolMap = {
      USD: '$',
      GBP: '£',
      EUR: '€',
      BSV: 'BSV',
      SATS: 'SATS'
    };
    return symbolMap[this.preferredCurrency] || this.preferredCurrency;
  }

  /**
   * Fetch the exchange rates for usdPerBSV, gbpPerUsd, and eurPerUsd
   * @returns 
   */
  async fetchExchangeRates(): Promise<ExchangeRates> {
    try {
      const usdPerBsv = await this.services.getBsvExchangeRate()
      const gbpPerUsd = await this.services.getFiatExchangeRate('GBP')
      const eurPerUsd = await this.services.getFiatExchangeRate('EUR')

      this.exchangeRates = { usdPerBsv, gbpPerUsd, eurPerUsd }
      return this.exchangeRates
    } catch (err) {
      console.error(err)
      throw new Error('Failed to fetch exchange rates.')
    }
  }

  /**
   * Converts currency based on user's preferences
   * @param currency 
   * @param formatOptions 
   * @returns 
   */
  async convertCurrency(currency: string, formatOptions?: FormatOptions) {
    const preferredCurrency = await getPreferredCurrency({}) // TODO: Fix params
    let amount = parseFloat(currency.replace(/[^0-9.-]+/g, ""))
    let inputCurrency = currency.replace(/[\d.,\s]+/g, '').trim()
    inputCurrency = inputCurrency || (currency.includes('.') ? 'BSV' : 'SATS')

    let amountInUsd = this.convertToUsd(amount, inputCurrency)
    if (amountInUsd === null) {
      throw new Error('Unsupported currency')
    }

    let finalAmount = this.convertFromUsd(amountInUsd, preferredCurrency)
    if (finalAmount === null) {
      throw new Error('Unsupported preferred currency')
    }
    console.log('final', finalAmount)
    return formatAmountWithCurrency(finalAmount, preferredCurrency, formatOptions)
  }

  async convertToSatoshis(amount: number): Promise<number | null> {
    const preferredCurrency = await getPreferredCurrency({});
    const amountInUsd = this.convertToUsd(amount, preferredCurrency);
    if (amountInUsd === null) {
      console.error('Unsupported currency for conversion to USD:', preferredCurrency);
      return null;
    }
    // Now convert USD to SATS using the usdPerBsv exchange rate
    const satoshis = Math.ceil((amountInUsd / this.exchangeRates.usdPerBsv) * 100_000_000)
    return satoshis;
  }

  /**
   * Converts amount to USD
   * @param amount 
   * @param currency 
   * @returns 
   */
  convertToUsd(amount: number, currency: string): number | null {
    switch (currency.toUpperCase()) {
      case 'SATS':
        return (amount / 100_000_000) * this.exchangeRates.usdPerBsv
      case 'BSV':
        return amount * this.exchangeRates.usdPerBsv
      case 'GBP':
        return amount / this.exchangeRates.gbpPerUsd
      case 'EUR':
        return amount / this.exchangeRates.eurPerUsd
      case 'USD':
        return amount
      default:
        return null
    }
  }

  /**
   * Converts amount from USD to some other amount
   * @param amountInUsd 
   * @param currency 
   * @returns 
   */
  convertFromUsd(amountInUsd: number, currency: string): number | null {
    switch (currency) {
      case 'GBP':
        return amountInUsd * this.exchangeRates.gbpPerUsd
      case 'EUR':
        return amountInUsd * this.exchangeRates.eurPerUsd
      case 'BSV':
        return amountInUsd / this.exchangeRates.usdPerBsv
      case 'SATS':
        return (amountInUsd / this.exchangeRates.usdPerBsv) * 100_000_000
      case 'USD':
        return amountInUsd
      default:
        return null
    }
  }
}

export default CurrencyConverter
