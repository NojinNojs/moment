/**
 * Currency options with symbols and flags
 */
export const currencies = [
  { value: "USD", label: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { value: "EUR", label: "Euro", symbol: "€", flag: "🇪🇺" },
  { value: "GBP", label: "British Pound", symbol: "£", flag: "🇬🇧" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { value: "CAD", label: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
  { value: "SGD", label: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { value: "IDR", label: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
];

/**
 * Get currency data by currency code
 * @param code The currency code (e.g., "USD")
 * @returns The currency data object or undefined if not found
 */
export function getCurrencyByCode(code: string) {
  return currencies.find(c => c.value === code);
}

/**
 * Format a specific locale for a given currency
 * @param currencyCode The currency code
 * @returns The appropriate locale string for the currency
 */
export function getCurrencyLocale(currencyCode: string): string {
  switch (currencyCode) {
    case 'IDR':
      return 'id-ID';
    case 'EUR':
      return 'de-DE';
    case 'GBP':
      return 'en-GB';
    default:
      return 'en-US';
  }
}

/**
 * Check if a currency typically doesn't use decimals
 * @param currencyCode The currency code
 * @returns Boolean indicating if the currency doesn't use decimals
 */
export function isNoDecimalCurrency(currencyCode: string): boolean {
  return ['JPY'].includes(currencyCode);
} 