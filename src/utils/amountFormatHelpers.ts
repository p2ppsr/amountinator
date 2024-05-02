export function formatAmountWithCurrency(amount: number, currency: string, options?: { decimalPlaces?: number, useCommas?: boolean, useUnderscores?: boolean }): string {
  // Determine the default number of decimal places if not specified
  let decimals = options?.decimalPlaces  // Respect explicitly set decimal places
  if (decimals === undefined) {
    // Default handling based on the type of currency
    if (currency === 'BSV' || currency === 'SATS') {
      decimals = 8  // Assume a high precision default for cryptocurrencies
    } else {
      decimals = 2  // Standard for most fiat currencies
    }
  }

  // Formatting the amount to the specified number of decimals
  let formattedAmount = amount.toFixed(decimals)

  let parts = formattedAmount.split('.')
  let integerPart = parts[0]
  let decimalPart = parts[1]

  // Apply comma or underscore formatting to the integer part
  if (options?.useUnderscores) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '_')
  } else if (options?.useCommas !== false) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // Ensure that we do not show decimal places if decimalPart is '00' or if decimals is 0
  let formatted = (decimalPart && decimals > 0 && parseInt(decimalPart, 10) !== 0) ? `${integerPart}.${decimalPart}` : integerPart
  return formatCurrency(formatted, currency)
}

export function formatCurrency(formattedAmount: string, currency: string): string {
  switch (currency) {
    case 'USD':
      return `$${formattedAmount}`
    case 'GBP':
      return `£${formattedAmount}`
    case 'EUR':
      return `€${formattedAmount}`
    case 'SATS':
      return `${formattedAmount} satoshis`
    case 'BSV':
      return `${formattedAmount} BSV`
    default:
      return formattedAmount
  }
}