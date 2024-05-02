import React, { useState, useEffect } from 'react'
import { CwiExternalServices } from 'cwi-external-services'
import { getPreferredCurrency } from '@babbage/sdk-ts'
import { formatAmountWithCurrency } from '../../utils/amountFormatHelpers'

const services = new CwiExternalServices(CwiExternalServices.createDefaultOptions())
const EXCHANGE_RATE_UPDATE_INTERVAL = 5 * 60 * 1000

interface AmountDisplayProps {
  children: string
  formatOptions?: {
    decimalPlaces?: number
    useCommas?: boolean
    useUnderscores?: boolean
  }
}

const AmountDisplay: React.FC<AmountDisplayProps> = ({ children, formatOptions }) => {
  const [exchangeRates, setExchangeRates] = useState<{ usdPerBsv: number, gbpPerUsd: number, eurPerUsd: number }>({ usdPerBsv: 0, gbpPerUsd: 0, eurPerUsd: 0 })
  const [error, setError] = useState<string | null>(null)
  const [displayAmount, setDisplayAmount] = useState<string>('')

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const usdPerBsv = await services.getBsvExchangeRate()
        const gbpPerUsd = await services.getFiatExchangeRate('GBP')
        const eurPerUsd = await services.getFiatExchangeRate('EUR')
        setExchangeRates({ usdPerBsv, gbpPerUsd, eurPerUsd })
      } catch (err) {
        setError('Failed to fetch exchange rates')
        console.error(err)
      }
    }

    fetchExchangeRates()
    const intervalId = setInterval(fetchExchangeRates, EXCHANGE_RATE_UPDATE_INTERVAL)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const convertCurrency = async () => {
      const preferredCurrency = await getPreferredCurrency({})
      let amount = parseFloat(children.replace(/[^0-9.-]+/g, ""))
      let inputCurrency = children.replace(/[\d.,\s]+/g, '').trim()
      inputCurrency = inputCurrency || (children.includes('.') ? 'BSV' : 'SATS')

      let amountInUsd = convertToUsd(amount, inputCurrency)
      if (amountInUsd === null) {
        setError('Unsupported currency')
        return
      }

      let finalAmount = convertFromUsd(amountInUsd, preferredCurrency)
      if (finalAmount === null) {
        setError('Unsupported preferred currency')
        return
      }

      setDisplayAmount(formatAmountWithCurrency(finalAmount, preferredCurrency, formatOptions))
    }

    convertCurrency()
  }, [children, exchangeRates, formatOptions])

  return (
    <div>
      {error ? `Error: ${error}` : displayAmount}
    </div>
  )

  function convertToUsd(amount: number, currency: string): number | null {
    switch (currency.toUpperCase()) {
      case 'SATS':
        return (amount / 100_000_000) * exchangeRates.usdPerBsv
      case 'BSV':
        return amount * exchangeRates.usdPerBsv
      case 'GBP':
        return amount / exchangeRates.gbpPerUsd
      case 'EUR':
        return amount / exchangeRates.eurPerUsd
      case 'USD':
        return amount
      default:
        return null
    }
  }

  function convertFromUsd(amountInUsd: number, currency: string): number | null {
    switch (currency) {
      case 'GBP':
        return amountInUsd * exchangeRates.gbpPerUsd
      case 'EUR':
        return amountInUsd * exchangeRates.eurPerUsd
      case 'BSV':
        return amountInUsd / exchangeRates.usdPerBsv
      case 'SATS':
        return (amountInUsd / exchangeRates.usdPerBsv) * 100_000_000
      case 'USD':
        return amountInUsd
      default:
        return null
    }
  }
}
export default AmountDisplay