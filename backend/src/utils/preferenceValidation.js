/**
 * Centralized utility for validating and processing user preference updates
 * This removes duplication and ensures consistency across different controllers
 */

/**
 * Validates user preference data and builds an update object for MongoDB
 * @param {Object} requestBody - The request body containing preference fields to update
 * @returns {Object} Validation result with update object and status information
 */
const validateAndBuildPreferenceUpdate = (requestBody) => {
  const { currency, dateFormat } = requestBody;
  const preferencesUpdate = {};
  const errors = [];
  
  // Validate currency if provided
  if (currency !== undefined) {
    const allowedCurrencies = ['USD', 'IDR', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'SGD', 'MYR'];
    if (!allowedCurrencies.includes(currency)) {
      errors.push('Invalid currency');
    } else {
      preferencesUpdate['preferences.currency'] = currency;
    }
  }
  
  // Validate dateFormat if provided
  if (dateFormat !== undefined) {
    const allowedDateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
    if (!allowedDateFormats.includes(dateFormat)) {
      errors.push('Invalid date format');
    } else {
      preferencesUpdate['preferences.dateFormat'] = dateFormat;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    hasUpdates: Object.keys(preferencesUpdate).length > 0,
    preferencesUpdate
  };
};

module.exports = {
  validateAndBuildPreferenceUpdate
}; 