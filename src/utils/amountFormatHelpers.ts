export function formatAmountWithCurrency(amount: number, currency: string, options?: { decimalPlaces?: number, useCommas?: boolean, useUnderscores?: boolean }): { formattedAmount: string, hoverText?: string } {
  const { decimalPlaces, useCommas = true, useUnderscores = false } = options || {}
  let decimals

  if (decimalPlaces !== undefined) {
    decimals = decimalPlaces
  } else {
    if (amount < 1 && amount !== 0) {
      decimals = Math.max(2, -Math.floor(Math.log10(amount)) + 1) // Adjust for less precision if needed
      decimals = Math.min(decimals, 4)
    } else {
      decimals = (['BSV', 'SATS'].includes(currency) ? 8 : 2)
    }
  }

  let formattedAmount = amount.toFixed(decimals)
  formattedAmount = parseFloat(formattedAmount).toString()
  let [integerPart, decimalPart] = formattedAmount.split('.')

  if (useUnderscores) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '_')
  } else if (useCommas) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  let finalFormatted = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
  let result: { formattedAmount: string, hoverText?: string } = {
    formattedAmount: finalFormatted
  }

  // Only add hoverText if the amount is less than 0.01
  if (amount < 0.01) {
    result.hoverText = '< $0.01'
  }

  switch (currency) {
    case 'USD': result.formattedAmount = `$${finalFormatted}`; break
    case 'GBP': result.formattedAmount = `£${finalFormatted}`; break
    case 'EUR': result.formattedAmount = `€${finalFormatted}`; break
    case 'SATS': result.formattedAmount += ' satoshis'; break
    case 'BSV': result.formattedAmount += ' BSV'; break
  }

  return result
}
