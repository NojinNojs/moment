/**
 * Shared validation utilities for currencies and date formats
 * Used across the application to ensure consistent validation rules
 */

// Constants for allowed currencies and date formats
const allowedCurrencies = ['USD', 'IDR', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'SGD', 'MYR'];
const allowedDateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

/**
 * Validates if a currency is in the allowed list
 * @param {string} currency - Currency code to validate
 * @returns {boolean} - Whether the currency is valid
 */
exports.validateCurrency = (currency) => {
  return allowedCurrencies.includes(currency);
};

/**
 * Validates if a date format is in the allowed list
 * @param {string} dateFormat - Date format to validate
 * @returns {boolean} - Whether the date format is valid
 */
exports.validateDateFormat = (dateFormat) => {
  return allowedDateFormats.includes(dateFormat);
};

// Export constants for direct use
exports.allowedCurrencies = allowedCurrencies;
exports.allowedDateFormats = allowedDateFormats; 