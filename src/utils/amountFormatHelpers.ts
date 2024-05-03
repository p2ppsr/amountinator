export function formatAmountWithCurrency(amount: number, currency: string, options?: { decimalPlaces?: number, useCommas?: boolean, useUnderscores?: boolean }): string {
  const { decimalPlaces, useCommas = true, useUnderscores = false } = options || {}

  let decimals
  if (decimalPlaces !== undefined) {
    decimals = decimalPlaces
  } else {
    if (amount < 1 && amount !== 0) {
      // Calculate precision needed to show at least one significant figure
      decimals = Math.max(2, -Math.floor(Math.log10(amount)) + 1) // One less to round it off
      // Cap the maximum number of decimal places for very small amounts
      decimals = Math.min(decimals, 4) // This caps the decimals to 4, adjust as necessary
    } else {
      // Default precision for larger amounts or specific currencies
      decimals = (['BSV', 'SATS'].includes(currency) ? 8 : 2)
    }
  }

  // Format the amount with determined decimal places
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
