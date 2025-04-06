// This file contains utility functions used across the application.

/**
 * Format a date into a standard readable format
 * @param {Date|string} date - The date to format
 * @param {string} format - Optional format (default: 'YYYY-MM-DD')
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      return '';
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    // Format based on the requested format
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD HH:mm':
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      case 'YYYY-MM-DD HH:mm:ss':
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      default:
        return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Sanitize input to prevent potential security issues
 * @param {string} input - The string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Basic sanitization, replace with more comprehensive solution if needed
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Format currency value
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD') 
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD') => {
  if (isNaN(amount)) return '';
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${amount}`;
  }
};

module.exports = { 
  formatDate,
  sanitizeInput,
  formatCurrency
}; 