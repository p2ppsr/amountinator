import { getPreferredCurrency } from '@babbage/sdk-ts'
import { CwiExternalServices } from 'cwi-external-services'
import { formatAmountWithCurrency } from './amountFormatHelpers'
import { ExchangeRates, FormatOptions } from '../types'
const EXCHANGE_RATE_UPDATE_INTERVAL = 5 * 60 * 1000

/**
 * Converts currency amounts to user's preferred currency, and supports converting all supported currency types to satoshis.
 */
export class CurrencyConverter {
  public exchangeRates: ExchangeRates
  public preferredCurrency: string
  private services: CwiExternalServices

  constructor() {
    // Private to prevent direct construction calls
    this.services = new CwiExternalServices(CwiExternalServices.createDefaultOptions())
    this.exchangeRates = { usdPerBsv: 0, gbpPerUsd: 0, eurPerUsd: 0 }
    this.preferredCurrency = 'USD'
  }

  /**
   * Initializes the currency converter by fetching
   * - the currency exchange rates
   * - the user's preferred currency
   * - and set's an interval to keep the exchange rate updated.
   * TODO: Test interval updates when used in a React UI
   */
  async initialize(): Promise<void> {
    await this.fetchExchangeRates()
    this.preferredCurrency = await getPreferredCurrency({})
    // Start a timer to update rates periodically
    setInterval(() => this.fetchExchangeRates(), EXCHANGE_RATE_UPDATE_INTERVAL)
  }

  /**
   * @returns - the symbol associated with a user's preferred currency
   */
  getCurrencySymbol(): string {
    const symbolMap = {
      USD: '$',
      GBP: '£',
      EUR: '€',
      BSV: 'BSV',
      SATS: 'SATS'
    }
    return symbolMap[this.preferredCurrency] || this.preferredCurrency
  }

  /**
   * Fetch the exchange rates for usdPerBSV, gbpPerUsd, and eurPerUsd
   * @returns {Promise<ExchangeRates>}
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
   * Converts currency amount based on user's preferences
   * @param {string} amount - the currency to convert
   * @param {FormatOptions} formatOptions 
   * @returns 
   */
  async convertCurrency(amount: string, formatOptions?: FormatOptions) {
    const preferredCurrency = await getPreferredCurrency({}) // TODO: Fix params
    let parsedAmount = parseFloat(amount.replace(/[^0-9.-]+/g, ""))
    let inputCurrency = amount.replace(/[\d.,\s]+/g, '').trim()
    inputCurrency = inputCurrency || (amount.includes('.') ? 'BSV' : 'SATS')

    let amountInUsd = this.convertToUsd(parsedAmount, inputCurrency)
    if (amountInUsd === null) {
      throw new Error('Unsupported currency')
    }

    let finalAmount = this.convertFromUsd(amountInUsd, preferredCurrency)
    if (finalAmount === null) {
      throw new Error('Unsupported preferred currency')
    }
    return formatAmountWithCurrency(finalAmount, preferredCurrency, formatOptions)
  }

  /**
   * Convert an amount given in any of the supported currencies to an amount in satoshis
   * @param amount 
   * @returns 
   */
  async convertToSatoshis(amount: number): Promise<number | null> {
    const amountInUsd = this.convertToUsd(amount, this.preferredCurrency)
    if (amountInUsd === null) {
      console.error('Unsupported currency for conversion to USD:', this.preferredCurrency)
      return null
    }
    // Now convert USD to SATS using the usdPerBsv exchange rate
    const satoshis = Math.ceil((amountInUsd / this.exchangeRates.usdPerBsv) * 100_000_000)
    return satoshis
  }

  /**
   * Converts amount to USD
   * @param {number} amount 
   * @param {string} currency - currency type for the amount given
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
   * @param {number} amountInUsd 
   * @param {string} currency - currency type for the amount given
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
