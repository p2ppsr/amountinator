import { formatAmountWithCurrency } from '../src/utils/amountFormatHelpers'

describe('formatAmountWithCurrency', () => {
  test('formats USD with default settings', () => {
    expect(formatAmountWithCurrency(1234.56, 'USD')).toBe('$1,234.56')
  })

  test('formats EUR with no decimals', () => {
    expect(formatAmountWithCurrency(1234, 'EUR', { decimalPlaces: 0 })).toBe('€1,234')
  })

  test('formats GBP with underscores', () => {
    expect(formatAmountWithCurrency(1234567.89, 'GBP', { useUnderscores: true })).toBe('£1_234_567.89')
  })

  test('formats SATS with many decimals', () => {
    expect(formatAmountWithCurrency(0.000012345, 'SATS', { decimalPlaces: 9 })).toBe('0.000012345 satoshis')
  })
  test('formats BSV without commas', () => {
    expect(formatAmountWithCurrency(1000, 'BSV', { useCommas: false })).toBe('1000 BSV')
  })


  test('handles very small amounts correctly', () => {
    expect(formatAmountWithCurrency(0.00000012345, 'USD', { decimalPlaces: 10 })).toBe('$0.0000001235')
  })

  test('formats negative amounts correctly', () => {
    expect(formatAmountWithCurrency(-1234.56, 'EUR')).toBe('€-1,234.56')
  })
})
