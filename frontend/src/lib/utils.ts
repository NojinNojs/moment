import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import websocketService from '@/services/websocket';
import apiService from '@/services/api';

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
    console.log(`[EventBus] Subscribed to '${event}' (total: ${this.events[event].length})`);
    
    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from an event
   * @param event Event name
   * @param callback Function to remove
   */
  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    if (this.events[event]) {
      const initialLength = this.events[event].length;
      this.events[event] = this.events[event].filter(cb => cb !== callback);
      console.log(`[EventBus] Unsubscribed from '${event}' (removed: ${initialLength - this.events[event].length})`);
      
      // Clean up empty event arrays
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    }
  }

  /**
   * Emit an event with data
   * @param event Event name
   * @param data Data to send to subscribers
   */
  emit<T = unknown>(event: string, data?: T): void {
    if (this.events[event]) {
      console.log(`[EventBus] Emitting '${event}' to ${this.events[event].length} listeners`);
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in event handler for ${event}:`, error);
        }
      });
    } else {
      console.log(`[EventBus] No listeners for '${event}'`);
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
    if (this.events[event]) {
      const count = this.events[event].length;
      delete this.events[event];
      console.log(`[EventBus] Removed all listeners for '${event}' (count: ${count})`);
    }
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

// Map certain timezone patterns to country codes
export const timezoneToCountry: Record<string, string> = {
  // Asia
  'Asia/Jakarta': 'ID',
  'Asia/Makassar': 'ID',
  'Asia/Pontianak': 'ID',
  'Asia/Jayapura': 'ID',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Shanghai': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  
  // America
  'America/New_York': 'US',
  'America/Los_Angeles': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  
  // Europe
  'Europe/London': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  
  // Oceania
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ'
};

// Map country codes to currency codes
export const countryToCurrency: Record<string, string> = {
  'US': 'USD',
  'ID': 'IDR',
  'SG': 'SGD',
  'MY': 'MYR',
  'CN': 'CNY',
  'HK': 'HKD',
  'JP': 'JPY',
  'KR': 'KRW',
  'TH': 'THB',
  'VN': 'VND',
  'GB': 'GBP',
  'CA': 'CAD',
  'AU': 'AUD',
  'NZ': 'NZD',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR'
};

/**
 * Detect the user's currency based on browser locale, timezone, and language preferences
 * with enhanced accuracy and better logging
 * @returns Detected currency code
 */
export function detectUserCurrency(): string {
  try {
    console.log('[detectUserCurrency] Starting currency detection');
    
    // First check if currency is saved in user settings in localStorage
    const savedCurrency = localStorage.getItem('userCurrency');
    if (savedCurrency) {
      console.log(`[detectUserCurrency] Using saved currency from localStorage: ${savedCurrency}`);
      return savedCurrency;
    }
    
    // Get all browser languages, with primary language first
    const userLanguages = navigator.languages || [navigator.language];
    console.log(`[detectUserCurrency] Browser languages: ${userLanguages.join(', ')}`);
    
    // Get timezone information
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`[detectUserCurrency] Timezone detected: ${timeZone}`);
    
    // Try to detect country from timezone
    let countryFromTimezone = '';
    if (timeZone) {
      // Check for direct match in timezone mapping
      if (timeZone in timezoneToCountry) {
        countryFromTimezone = timezoneToCountry[timeZone];
        console.log(`[detectUserCurrency] Country detected from timezone: ${countryFromTimezone}`);
      } 
      // Check for partial match (e.g., "Asia/Jakarta" would match "Jakarta")
      else {
        // Get the second part of the timezone (after the /)
        const timezoneParts = timeZone.split('/');
        if (timezoneParts.length > 1) {
          const cityOrRegion = timezoneParts[1];
          const continent = timezoneParts[0];
          
          // Check for common patterns
          if (continent === 'Asia') {
            if (cityOrRegion.includes('Jakarta') || timeZone.includes('Indonesia')) {
              countryFromTimezone = 'ID';
              console.log('[detectUserCurrency] Indonesia detected from timezone parts');
            } else if (cityOrRegion.includes('Singapore')) {
              countryFromTimezone = 'SG';
              console.log('[detectUserCurrency] Singapore detected from timezone parts');
            } else if (cityOrRegion.includes('Kuala') || timeZone.includes('Malaysia')) {
              countryFromTimezone = 'MY';
              console.log('[detectUserCurrency] Malaysia detected from timezone parts');
            }
          }
        }
      }
    }
    
    // If we found a country from timezone and it has a known currency, use it
    if (countryFromTimezone && countryFromTimezone in countryToCurrency) {
      const currencyFromTimezone = countryToCurrency[countryFromTimezone];
      console.log(`[detectUserCurrency] Currency detected from timezone: ${currencyFromTimezone}`);
      return currencyFromTimezone;
    }
    
    // Check all user languages for matches, prioritizing exact matches
    for (const language of userLanguages) {
      // Priority for Indonesian users (from locale)
      if (language.includes('ID') || language.startsWith('id')) {
        console.log('[detectUserCurrency] Indonesian locale detected, using IDR');
        return 'IDR';
      }
      
      // Try to find a direct match in our mapping
      if (language in localeToCurrency) {
        const currency = localeToCurrency[language];
        console.log(`[detectUserCurrency] Direct locale match found: ${language} -> ${currency}`);
        return currency;
      }
    }
    
    // If no match found for full locales, try language codes
    for (const language of userLanguages) {
      // Try to find a match for the language part (e.g., 'en' from 'en-US')
      const languageCode = language.split('-')[0];
      if (languageCode in localeToCurrency) {
        const currency = localeToCurrency[languageCode];
        console.log(`[detectUserCurrency] Language code match found: ${languageCode} -> ${currency}`);
        return currency;
      }
    }
    
    // Fallback to USD
    console.log('[detectUserCurrency] No specific locale match found, falling back to USD');
    return 'USD';
  } catch (error) {
    console.error('[detectUserCurrency] Error detecting user currency:', error);
    return 'USD';
  }
}

/**
 * Get user's currency preference from server if logged in, otherwise from localStorage
 * @param userId Optional user ID to fetch from server
 * @returns Promise with currency code
 */
export async function getUserCurrencyPreference(userId?: string): Promise<string> {
  try {
    console.log('[getUserCurrencyPreference] Checking user currency preference');
    
    // If user is logged in, try to get preference from server
    if (userId) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Get API URL from environment variable or use default
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
        
        try {
          // Fix the URL path to avoid duplicate /api/ segments
          const url = `${apiUrl}/users/preferences`;
          console.log(`[getUserCurrencyPreference] Fetching from: ${url}`);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.currency) {
              // Save to localStorage for offline use
              localStorage.setItem('userCurrency', data.currency);
              return data.currency;
            }
          } else {
            // Log error details for debugging
            console.error(`[getUserCurrencyPreference] Server response error: ${response.status} ${response.statusText}`);
          }
        } catch (serverError) {
          console.error('[getUserCurrencyPreference] Error fetching from server, falling back to localStorage:', serverError);
        }
      }
    }
    
    // Fall back to localStorage
    const savedCurrency = localStorage.getItem('userCurrency');
    if (savedCurrency) {
      console.log(`[getUserCurrencyPreference] Using saved currency from localStorage: ${savedCurrency}`);
      return savedCurrency;
    }
    
    // If nothing is found, detect based on locale
    const detectedCurrency = detectUserCurrency();
    console.log(`[getUserCurrencyPreference] No saved preference, using detected currency: ${detectedCurrency}`);
    // Save the detected currency for future use
    localStorage.setItem('userCurrency', detectedCurrency);
    return detectedCurrency;
  } catch (error) {
    console.error('[getUserCurrencyPreference] Error getting currency preference:', error);
    return 'USD'; // Default fallback
  }
}

/**
 * Save user's currency preference both locally and to the server if user is logged in
 * @param currency Currency code to save
 * @param userId Optional user ID for server-side storage
 */
export async function saveUserCurrencyPreference(currency: string, userId?: string): Promise<void> {
  try {
    console.log(`[saveUserCurrencyPreference] Saving currency preference: ${currency}`);
    
    // Save to localStorage for local persistence
    localStorage.setItem('userCurrency', currency);
    
    // If user is logged in, save to server
    if (userId) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Construct URL with host and path separately to avoid duplication
        const host = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.split('/api/')[0] : 'http://localhost:3000';
        const url = `${host}/api/v1/users/preferences`;
        console.log(`[saveUserCurrencyPreference] Saving to server: ${url}`);
        
        try {
          // Get CSRF token if available
          let csrfToken = apiService.getCsrfToken();
          
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          };
          
          // Add CSRF token if available
          if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
            console.log('[saveUserCurrencyPreference] Added CSRF token to request');
          } else {
            console.log('[saveUserCurrencyPreference] No CSRF token available');
            // Attempt to fetch a new token
            csrfToken = await apiService.fetchCsrfToken();
            
            // Try again with the new token
            if (csrfToken) {
              headers['X-CSRF-Token'] = csrfToken;
              console.log('[saveUserCurrencyPreference] Added new CSRF token to request');
            }
          }
          
          const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ currency })
          });
          
          if (response.ok) {
            console.log('[saveUserCurrencyPreference] Successfully saved to server');
          } else {
            // Log error details for debugging
            console.error(`[saveUserCurrencyPreference] Server response error: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError) {
          console.error('[saveUserCurrencyPreference] Network error:', fetchError);
        }
        
        // Try to notify other devices via WebSocket
        try {
          if (typeof websocketService !== 'undefined' && websocketService.isConnected()) {
            console.log(`[saveUserCurrencyPreference] Broadcasting update via WebSocket to other devices: ${currency}`);
            websocketService.sendPreferenceUpdate('currency', currency);
          } else {
            console.log('[saveUserCurrencyPreference] WebSocket not connected, skipping broadcast');
          }
        } catch (wsError) {
          console.error('[saveUserCurrencyPreference] WebSocket error:', wsError);
        }
      }
    }
  } catch (error) {
    console.error('[saveUserCurrencyPreference] Error saving currency preference:', error);
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
