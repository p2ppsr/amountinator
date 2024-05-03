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
   * @param {number | string} amount - the currency to convert
   * @param {FormatOptions} formatOptions 
   * @returns 
   */
  async convertAmount(amount: number | string, formatOptions?: FormatOptions) {
    const amountAsString = amount.toString()
    const preferredCurrency = await getPreferredCurrency({}) // TODO: Fix params
    let parsedAmount = parseFloat(amountAsString.replace(/[^0-9.-]+/g, ""))
    let inputCurrency = amountAsString.replace(/[\d.,\s]+/g, '').trim()
    inputCurrency = inputCurrency || (amountAsString.includes('.') ? 'BSV' : 'SATS')

    // Use convertCurrency to directly convert from the input currency to the preferred currency
    let finalAmount = this.convertCurrency(parsedAmount, inputCurrency, preferredCurrency)
    if (finalAmount === null) {
      throw new Error('Unsupported currency or conversion error')
    }
    return formatAmountWithCurrency(finalAmount, preferredCurrency, formatOptions)
  }

  /**
   * Convert an amount given in any of the supported currencies to an amount in satoshis
   * @param amount 
   * @returns 
   */
  async convertToSatoshis(amount: number): Promise<number | null> {
    // Directly convert the amount from the preferred currency to SATS
    const satoshis = this.convertCurrency(amount, this.preferredCurrency, 'SATS')
    if (satoshis === null) {
      console.error('Unsupported currency or conversion error:', this.preferredCurrency)
      return null
    }
    return Math.ceil(satoshis)
  }

  /**
   * Converts a given amount from one currency to another.
   * @param {number} amount - The amount to be converted.
   * @param {string} fromCurrency - The currency code of the amount being converted.
   * @param {string} toCurrency - The currency code to convert the amount to.
   * @returns {number | null} - The converted amount or null if the conversion cannot be performed.
   */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number | null {
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return amount
    }

    let amountInUsd: number | null

    // Convert from the original currency to USD
    switch (fromCurrency.toUpperCase()) {
      case 'SATS':
        amountInUsd = (amount / 100_000_000) * this.exchangeRates.usdPerBsv
        break
      case 'BSV':
        amountInUsd = amount * this.exchangeRates.usdPerBsv
        break
      case 'GBP':
        amountInUsd = amount / this.exchangeRates.gbpPerUsd
        break
      case 'EUR':
        amountInUsd = amount / this.exchangeRates.eurPerUsd
        break
      case 'USD':
        amountInUsd = amount
        break
      default:
        throw new Error('Currency not supported!')
    }

    // Convert from USD to the target currency
    switch (toCurrency.toUpperCase()) {
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
        throw new Error('Currency not supported!')
    }
  }
}
