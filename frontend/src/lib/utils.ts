import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * @param inputs Class names to combine
 * @returns Combined class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define proper EventHandler and EventCallback types
type EventCallback<T = unknown> = (data: T) => void;
type EventUnsubscribe = () => void;

/**
 * Enhanced event bus to enable communication between components without direct dependencies
 */
export class EventBusClass {
  private events: {[key: string]: Array<(data: unknown) => void>} = {};

  /**
   * Subscribe to an event
   * @param event Event name
   * @param callback Function to call when event is emitted
   * @returns Unsubscribe function
   */
  on<T = unknown>(event: string, callback: EventCallback<T>): EventUnsubscribe {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event].push(callback as EventCallback);
    
    // Return unsubscribe function
    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    };
  }

  /**
   * Emit an event with data
   * @param event Event name
   * @param data Data to send to subscribers
   */
  emit<T = unknown>(event: string, data?: T): void {
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get count of listeners for an event
   * @param event Event name
   * @returns Number of listeners
   */
  listenerCount(event: string): number {
    return this.events[event]?.length || 0;
  }
  
  /**
   * Log all current listeners (for debugging)
   */
  debug(): void {
    console.log('[EventBus] Current listeners:');
    Object.entries(this.events).forEach(([event, callbacks]) => {
      console.log(`- ${event}: ${callbacks.length} listeners`);
    });
  }

  /**
   * Remove all listeners for an event
   * @param event Event name
   */
  removeAllListeners(event: string): void {
    delete this.events[event];
  }
}

// Create a singleton instance for global use
export const EventBus = new EventBusClass();

/**
 * Format a number as currency
 * This is a legacy function; for proper currency formatting with user settings, use useCurrencyFormat hook
 * 
 * @param value The number to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 * @deprecated Use the useCurrencyFormat hook instead for app-wide currency consistency
 */
export function formatCurrency(value: number, currency = "USD"): string {
  // Apply locale based on currency
  let locale = 'en-US';
  
  switch (currency) {
    case 'IDR':
      locale = 'id-ID';
      break;
    case 'EUR':
      locale = 'de-DE';
      break;
    case 'GBP':
      locale = 'en-GB';
      break;
  }
  
  // Handle zero decimals for certain currencies
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND'];
  const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2;
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a date to a string
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Truncate a string if it exceeds a specified length
 * @param str String to truncate
 * @param length Maximum length
 * @param ending String to append at the end (default: "...")
 * @returns Truncated string
 */
export function truncateString(str: string, length: number, ending = "..."): string {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length - ending.length) + ending;
}

/**
 * Capitalize the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Debounce a function
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Deep clone an object
 * @param obj Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Format a number with commas as thousand separators and a decimal separator
 * @param value The number or string to format
 * @param locale The locale to use for formatting (default: en-US)
 * @returns Formatted number string
 */
export function formatAmountWithCommas(value: string | number, locale: 'en-US' | 'id-ID' = 'en-US'): string {
  if (!value && value !== 0) return '';
  
  // Convert to string if it's a number
  const stringValue = typeof value === 'number' ? value.toString() : value;
  
  // If the string is empty, return empty
  if (!stringValue) return '';
  
  // Determine separators based on locale
  const thousandSeparator = locale === 'en-US' ? ',' : '.';
  const decimalSeparator = locale === 'en-US' ? '.' : ',';
  
  // Check if the input ends with a decimal separator
  const endsWithDecimal = stringValue.endsWith('.') || stringValue.endsWith(',');
  
  // Normalize the input by replacing commas with periods for processing
  const normalizedValue = stringValue.replace(/,/g, '.');
  
  // Special case: if the value is just a decimal point
  if (normalizedValue === '.') {
    return `0${decimalSeparator}`;
  }
  
  // Split by decimal point
  const parts = normalizedValue.split('.');
  const integerPart = parts[0];
  const hasDecimal = parts.length > 1;
  const decimalPart = hasDecimal ? parts[1] : '';
  
  // Format the integer part with commas
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  // If there's a decimal part or the input ended with a decimal, include it
  if (hasDecimal || endsWithDecimal) {
    return `${formattedInteger}${decimalSeparator}${decimalPart}`;
  }
  
  return formattedInteger;
}

// Map to determine currency code from browser locale
export const localeToCurrency: Record<string, string> = {
  // English variants
  'en-US': 'USD',
  'en-GB': 'GBP',
  'en-CA': 'CAD',
  'en-AU': 'AUD',
  'en-NZ': 'NZD',
  'en-SG': 'SGD',
  
  // Asian languages/countries
  'id': 'IDR',
  'id-ID': 'IDR',
  'zh-CN': 'CNY',
  'zh-HK': 'HKD',
  'zh-TW': 'TWD',
  'ja': 'JPY',
  'ja-JP': 'JPY',
  'ko': 'KRW',
  'ko-KR': 'KRW',
  'th': 'THB',
  'th-TH': 'THB',
  'vi': 'VND',
  'vi-VN': 'VND',
  'ms': 'MYR',
  'ms-MY': 'MYR',
  
  // European languages/countries
  'de': 'EUR',
  'fr': 'EUR',
  'it': 'EUR',
  'es': 'EUR',
  'pt': 'EUR',
  'pt-BR': 'BRL',
  'ru': 'RUB',
};

/**
 * Detect the user's currency based on browser locale
 * @returns Detected currency code
 */
export function detectUserCurrency(): string {
  try {
    // Get browser language
    const browserLocale = navigator.language;
    
    // Try to find a direct match
    if (browserLocale in localeToCurrency) {
      return localeToCurrency[browserLocale];
    }
    
    // Try to find a match for the language part (e.g., 'en' from 'en-US')
    const languageCode = browserLocale.split('-')[0];
    if (languageCode in localeToCurrency) {
      return localeToCurrency[languageCode];
    }
    
    // Default to IDR for Indonesia
    if (browserLocale.includes('ID') || languageCode === 'id') {
      return 'IDR';
    }
    
    // Fallback to USD
    return 'USD';
  } catch (error) {
    console.error('Error detecting user currency:', error);
    return 'USD';
  }
}

/**
 * Form validation utility functions
 */
export const FormValidation = {
  /**
   * Validate that a field is not empty
   * @param value Field value
   * @param fieldName Name of the field for error message
   * @returns Error message or undefined if valid
   */
  required: (value: unknown, fieldName = 'Field'): string | undefined => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return undefined;
  },

  /**
   * Validate that a string has a minimum length
   * @param value String to validate
   * @param min Minimum length
   * @param fieldName Name of the field for error message
   * @returns Error message or undefined if valid
   */
  minLength: (value: string, min: number, fieldName = 'Field'): string | undefined => {
    if (!value || value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return undefined;
  },

  /**
   * Validate that a string doesn't exceed maximum length
   * @param value String to validate
   * @param max Maximum length
   * @param fieldName Name of the field for error message
   * @returns Error message or undefined if valid
   */
  maxLength: (value: string, max: number, fieldName = 'Field'): string | undefined => {
    if (value && value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return undefined;
  },

  /**
   * Validate that a numeric value is greater than zero
   * @param value Number to validate
   * @param fieldName Name of the field for error message
   * @returns Error message or undefined if valid
   */
  positiveNumber: (value: number | string, fieldName = 'Field'): string | undefined => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    if (num <= 0) {
      return `${fieldName} must be greater than zero`;
    }
    return undefined;
  },

  /**
   * Validate that two fields match
   * @param value1 First value
   * @param value2 Second value
   * @param fieldName Name of the field for error message
   * @returns Error message or undefined if valid
   */
  match: <T>(value1: T, value2: T, fieldName = 'Fields'): string | undefined => {
    if (value1 !== value2) {
      return `${fieldName} must match`;
    }
    return undefined;
  },

  /**
   * Validate an email address format
   * @param value Email to validate
   * @returns Error message or undefined if valid
   */
  email: (value: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  },

  /**
   * Run multiple validations and return the first error
   * @param validations Array of validation functions
   * @returns First error message or undefined if all validations pass
   */
  runValidations: (validations: Array<string | undefined>): string | undefined => {
    for (const validation of validations) {
      if (validation) {
        return validation;
      }
    }
    return undefined;
  }
};
