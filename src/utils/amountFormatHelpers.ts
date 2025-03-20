/**
 * Formats a numerical amount with a specified currency and optional formatting options.
 * 
 * @param amount - The numerical amount to format.
 * @param currency - The currency code ('USD', 'GBP', 'EUR', 'SATS', or 'BSV').
 * @param options - Optional formatting configuration.
 * @param options.decimalPlaces - The number of decimal places to display. If not provided, it's determined automatically.
 * @param options.useCommas - Whether to use commas as thousand separators. Defaults to true.
 * @param options.useUnderscores - Whether to use underscores as thousand separators. Takes precedence over useCommas if both are true.
 * 
 * @returns An object containing the formatted amount string and optionally a hover text.
 * @property {string} formattedAmount - The formatted amount with currency symbol.
 * @property {string} [hoverText] - The full formatted amount, present only for very small amounts (< 0.01).
 * 
 * @example
 * // Returns { formattedAmount: '$1,234.56' }
 * formatAmountWithCurrency(1234.56, 'USD')
 * 
 * @example
 * // Returns { formattedAmount: '1_234.56 BSV' }
 * formatAmountWithCurrency(1234.56, 'BSV', { useUnderscores: true })
 * 
 * @example
 * // Returns { formattedAmount: '< $0.01', hoverText: '$0.001' }
 * formatAmountWithCurrency(0.001, 'USD')
 */
export function formatAmountWithCurrency(amount: number, currency: string, options?: { decimalPlaces?: number, useCommas?: boolean, useUnderscores?: boolean }): { formattedAmount: string, hoverText?: string } {
  const { decimalPlaces, useCommas = true, useUnderscores = false } = options || {}

  // Determine the number of decimal places
  let decimals = decimalPlaces ?? ((amount < 1 && amount !== 0) ? Math.min(Math.max(2, -Math.floor(Math.log10(amount)) + 1), 4) : (['BSV', 'SATS'].includes(currency) ? 8 : 2))

  // Format the amount with determined decimal places
  let formattedAmount = parseFloat(amount.toFixed(decimals)).toString()
  let [integerPart, decimalPart] = formattedAmount.split('.')

  // Format the integer part with underscores or commas
  if (useUnderscores) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '_')
  } else if (useCommas) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Construct the full number string with decimal part conditionally added
  formattedAmount = decimalPart ? `${integerPart}.${decimalPart}` : integerPart

  // Prepare the currency symbol or suffix
  let currencySymbol = ''
  switch (currency) {
    case 'USD': currencySymbol = '$'; break
    case 'GBP': currencySymbol = '£'; break
    case 'EUR': currencySymbol = '€'; break
    case 'SATS': currencySymbol = ' satoshis'; break
    case 'BSV': currencySymbol = ' BSV'; break
  }

  // Add the currency symbol or suffix
  formattedAmount = currency === 'SATS' || currency === 'BSV' ? formattedAmount + currencySymbol : currencySymbol + formattedAmount

  // Construct result object
  let result: { formattedAmount: string, hoverText?: string } = { formattedAmount }

  // Add hoverText if applicable
  if (amount < 0.01) {
    result.hoverText = formattedAmount
    result.formattedAmount = '< $0.01'
  }

  return result
}
