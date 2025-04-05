import { useMemo } from 'react';
import useUserSettings from './useUserSettings';
import { currencies } from '@/lib/currencies';

/**
 * A hook that provides currency formatting functions based on user settings
 */
export default function useCurrencyFormat() {
  const { settings } = useUserSettings();
  
  const currencyData = useMemo(() => {
    const currencyCode = settings?.currency || 'USD';
    return currencies.find(c => c.value === currencyCode) || currencies[0];
  }, [settings?.currency]);
  
  /**
   * Format a numeric value according to user's currency settings
   * @param value - The numeric value to format
   * @param options - Optional formatting options
   * @returns Formatted currency string
   */
  const formatCurrency = useMemo(() => {
    return (value: number, options?: { 
      compact?: boolean; 
      hideCurrencySymbol?: boolean;
      showDecimals?: boolean;
    }) => {
      if (value === null || value === undefined || isNaN(value)) {
        return '';
      }
      
      const { compact = false, hideCurrencySymbol = false, showDecimals } = options || {};
      
      // Get currency code from user settings
      const currencyCode = settings?.currency || 'USD';
      
      let locale = 'en-US';
      let skipDecimalsForCurrency = false;
      
      // Set locale and special handling based on currency
      switch (currencyCode) {
        case 'IDR':
          locale = 'id-ID';
          break;
        case 'JPY':
        case 'KRW':
        case 'VND':
          // These currencies typically don't display decimals
          skipDecimalsForCurrency = true;
          break;
        case 'EUR':
          locale = 'de-DE';
          break;
        case 'GBP':
          locale = 'en-GB';
          break;
      }
      
      const formatOptions: Intl.NumberFormatOptions = {
        style: hideCurrencySymbol ? 'decimal' : 'currency',
        currency: currencyCode,
        // If compact is true, use compact notation
        notation: compact ? 'compact' : 'standard',
        compactDisplay: 'short',
      };
      
      // Determine decimals based on currency and options
      const shouldUseDecimals = showDecimals === undefined 
        ? !skipDecimalsForCurrency
        : showDecimals;
      
      if (shouldUseDecimals) {
        formatOptions.minimumFractionDigits = 2;
        formatOptions.maximumFractionDigits = 2;
      } else {
        formatOptions.minimumFractionDigits = 0;
        formatOptions.maximumFractionDigits = 0;
      }
      
      return new Intl.NumberFormat(locale, formatOptions).format(value);
    };
  }, [settings?.currency]);
  
  /**
   * Get the symbol for the current currency
   */
  const currencySymbol = useMemo(() => {
    return currencyData.symbol;
  }, [currencyData]);
  
  /**
   * Get the locale corresponding to the current currency
   */
  const currencyLocale = useMemo(() => {
    const currencyCode = settings?.currency || 'USD';
    
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
  }, [settings?.currency]);
  
  // Add a number formatter function
  const formatNumber = useMemo(() => {
    return (value: number, options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      useGrouping?: boolean;
    }) => {
      if (value === null || value === undefined || isNaN(value)) {
        return '';
      }
      
      const { 
        minimumFractionDigits = 0,
        maximumFractionDigits = 2,
        useGrouping = true
      } = options || {};
      
      return new Intl.NumberFormat(currencyLocale, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      }).format(value);
    };
  }, [currencyLocale]);
  
  // Add a percentage formatter function
  const formatPercent = useMemo(() => {
    return (value: number, options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
    }) => {
      if (value === null || value === undefined || isNaN(value)) {
        return '';
      }
      
      const { 
        minimumFractionDigits = 0,
        maximumFractionDigits = 1,
        signDisplay = 'auto'
      } = options || {};
      
      return new Intl.NumberFormat(currencyLocale, {
        style: 'percent',
        minimumFractionDigits,
        maximumFractionDigits,
        signDisplay
      }).format(value / 100); // Divide by 100 as formatPercent expects decimals (0.xx)
    };
  }, [currencyLocale]);
  
  return {
    formatCurrency,
    formatNumber,
    formatPercent,
    currencyCode: settings?.currency || 'USD',
    currencySymbol,
    currencyData,
    currencyLocale
  };
} 