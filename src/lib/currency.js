/**
 * Supported currencies: code, symbol, and optional symbol position.
 * Amounts are stored in DB as numbers; display uses the user's chosen currency.
 */
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
]

const DEFAULT_CODE = 'USD'

export function getCurrencyByCode(code) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES.find((c) => c.code === DEFAULT_CODE)
}

/**
 * Format a numeric amount for display using the given currency code.
 */
export function formatCurrency(amount, currencyCode = DEFAULT_CODE) {
  const currency = getCurrencyByCode(currencyCode)
  const num = Number(amount)
  if (Number.isNaN(num)) return `${currency.symbol}0.00`
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${currency.symbol}${formatted}`
}
