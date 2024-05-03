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

  switch (currency) {
    case 'USD': finalFormatted = `$${finalFormatted}`; break
    case 'GBP': finalFormatted = `£${finalFormatted}`; break
    case 'EUR': finalFormatted = `€${finalFormatted}`; break
    case 'SATS': finalFormatted += ' satoshis'; break
    case 'BSV': finalFormatted += ' BSV'; break
  }

  // Only add hoverText if the amount is less than 0.01
  if (amount < 0.01) {
    result.formattedAmount = '< $0.01'
    result.hoverText = finalFormatted
  }

  return result
}
