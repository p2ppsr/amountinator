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
