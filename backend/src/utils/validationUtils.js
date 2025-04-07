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

/**
 * Password validation rules with clear, individual validators and error messages
 */
const passwordValidation = {
  minLength: {
    validator: (password) => password.length >= 8,
    message: 'Password must be at least 8 characters long'
  },
  uppercase: {
    validator: (password) => /[A-Z]/.test(password),
    message: 'Password must contain at least one uppercase letter'
  },
  lowercase: {
    validator: (password) => /[a-z]/.test(password),
    message: 'Password must contain at least one lowercase letter'
  },
  number: {
    validator: (password) => /[0-9]/.test(password),
    message: 'Password must contain at least one number'
  },
  specialChar: {
    validator: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    message: 'Password must contain at least one special character'
  }
};

/**
 * Comprehensive password validation
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid flag and error messages
 */
exports.validatePassword = (password) => {
  const errors = [];
  
  // Apply all validation rules
  Object.values(passwordValidation).forEach(rule => {
    if (!rule.validator(password)) {
      errors.push(rule.message);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export constants for direct use
exports.allowedCurrencies = allowedCurrencies;
exports.allowedDateFormats = allowedDateFormats; 