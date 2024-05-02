export function formatAmountWithCurrency(amount: number, currency: string, options?: { decimalPlaces?: number, useCommas?: boolean, useUnderscores?: boolean }): string {
  const { decimalPlaces, useCommas = true, useUnderscores = false } = options || {}
  const decimals = decimalPlaces ?? (['BSV', 'SATS'].includes(currency) ? 8 : 2)

  // Format the amount
  let formattedAmount = amount.toFixed(decimals)

  // Split into integer and decimal parts
  let [integerPart, decimalPart] = formattedAmount.split('.')

  // Format the integer part
  if (useUnderscores) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '_')
  } else if (useCommas) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Construct the full number string with decimal part conditionally added
  let formatted = decimalPart && parseInt(decimalPart, 10) !== 0 ? `${integerPart}.${decimalPart}` : integerPart

  // Append currency symbol or suffix
  switch (currency) {
    case 'USD': return `$${formatted}`
    case 'GBP': return `£${formatted}`
    case 'EUR': return `€${formatted}`
    case 'SATS': return `${formatted} satoshis`
    case 'BSV': return `${formatted} BSV`
    default: return formatted
  }
}
