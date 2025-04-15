import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import useUserSettings from './useUserSettings';
import { currencies } from '@/lib/currencies';
import { EventBus } from '@/lib/utils';
import { useCurrencyFormat as useCurrencyContext } from '@/contexts/CurrencyContext';
import { useLocation } from 'react-router-dom';

/**
 * A hook that provides currency formatting functions based on user settings
 * with automatic refresh when currency changes or navigation occurs
 */
export default function useCurrencyFormat() {
  // Get currency context directly (includes the forceRefreshCurrency function)
  const currencyContext = useCurrencyContext();
  const { settings } = useUserSettings();
  const location = useLocation();
  const [localCurrencyCode, setLocalCurrencyCode] = useState<string>(currencyContext.currencyCode);
  
  // Track last path to detect navigation
  const lastPathRef = useRef(location.pathname);
  // Track if an update is ongoing to prevent infinite loops
  const isUpdatingRef = useRef(false);
  // Track the last update time to debounce frequent changes
  const lastUpdateTimeRef = useRef(Date.now());
  
  // Safe update function with debounce and recursive update protection
  const safeUpdate = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 300) {
      console.log('[useCurrencyFormat] Debouncing rapid updates');
      return;
    }
    
    if (isUpdatingRef.current) {
      console.log('[useCurrencyFormat] Update already in progress, skipping');
      return;
    }
    
    isUpdatingRef.current = true;
    lastUpdateTimeRef.current = now;
    
    // Use setTimeout to break the potential update cycle
    setTimeout(() => {
      // Force state update without needing a forceUpdate counter
      setLocalCurrencyCode(curr => curr === 'FORCE_UPDATE' ? currencyContext.currencyCode : 'FORCE_UPDATE');
      isUpdatingRef.current = false;
    }, 0);
  }, [currencyContext.currencyCode]);
  
  // Check for navigation between pages and force refresh if needed
  useEffect(() => {
    if (lastPathRef.current !== location.pathname) {
      console.log(`[useCurrencyFormat] Page navigation detected from ${lastPathRef.current} to ${location.pathname}`);
      lastPathRef.current = location.pathname;
    }
  }, [location.pathname]);
  
  // Create a callback function that will be stable across renders
  const handleCurrencyChange = useCallback((currencyCode: string) => {
    if (isUpdatingRef.current) return;
    
    console.log(`[useCurrencyFormat] Currency changed to: ${currencyCode}`);
    
    if (currencyCode !== localCurrencyCode) {
      setLocalCurrencyCode(currencyCode);
      safeUpdate();
    }
  }, [localCurrencyCode, safeUpdate]);
  
  // Stay in sync with settings and also listen for real-time currency updates
  useEffect(() => {
    // First sync with the context value if different
    if (currencyContext.currencyCode !== localCurrencyCode) {
      setLocalCurrencyCode(currencyContext.currencyCode);
    }
    
    // Subscribe to direct currency changes 
    EventBus.on('currency:changed', handleCurrencyChange);
    
    const handlePreferenceUpdate = (data: { preference: string; value: string }) => {
      if (data.preference === 'currency') {
        console.log(`[useCurrencyFormat] Currency preference updated to: ${data.value}`);
        handleCurrencyChange(data.value);
      }
    };
    
    EventBus.on('preference:updated', handlePreferenceUpdate);
    
    return () => {
      // Clean up listeners on unmount
      EventBus.off('currency:changed', handleCurrencyChange);
      EventBus.off('preference:updated', handlePreferenceUpdate);
    };
  }, [currencyContext.currencyCode, localCurrencyCode, handleCurrencyChange]);
  
  const currencyData = useMemo(() => {
    // Prioritize context values for immediate updates
    const currencyCode = currencyContext.currencyCode || localCurrencyCode || settings?.currency || 'USD';
    console.log(`[useCurrencyFormat] Using currency: ${currencyCode}`);
    return currencies.find(c => c.value === currencyCode) || currencies[0];
  }, [settings?.currency, localCurrencyCode, currencyContext.currencyCode]);
  
  // Helper function to determine if decimals should be used
  const determineIfShouldUseDecimals = (showDecimals: boolean | undefined, skipDecimalsForCurrency: boolean): boolean => {
    return showDecimals === undefined 
      ? !skipDecimalsForCurrency
      : showDecimals;
  };
  
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
      
      // Prioritize context values for guaranteed consistency
      const currencyCode = currencyContext.currencyCode || localCurrencyCode || settings?.currency || 'USD';
      
      let locale = currencyContext.currencyLocale || 'en-US';
      let skipDecimalsForCurrency = false;
      
      // Double-check locale based on currency code as fallback
      if (!currencyContext.currencyLocale) {
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
      }
      
      // Special case handling for some currencies to match the preview
      // that might have specific display requirements
      let customFormatting = false;
      let formattedValue = '';
      
      if (!hideCurrencySymbol) {
        switch (currencyCode) {
          case 'EUR':
            formattedValue = `${value.toLocaleString(locale, {
              minimumFractionDigits: determineIfShouldUseDecimals(showDecimals, skipDecimalsForCurrency) ? 2 : 0,
              maximumFractionDigits: determineIfShouldUseDecimals(showDecimals, skipDecimalsForCurrency) ? 2 : 0
            })}€`;
            customFormatting = true;
            break;
          case 'AUD':
            formattedValue = `A$${value.toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
            customFormatting = true;
            break;
          case 'SGD':
            formattedValue = `S$${value.toLocaleString(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
            customFormatting = true;
            break;
        }
      }
      
      if (customFormatting) {
        return formattedValue;
      }
      
      const formatOptions: Intl.NumberFormatOptions = {
        style: hideCurrencySymbol ? 'decimal' : 'currency',
        currency: currencyCode,
        // If compact is true, use compact notation
        notation: compact ? 'compact' : 'standard',
        compactDisplay: 'short',
      };
      
      // Determine decimals based on currency and options
      const shouldUseDecimals = determineIfShouldUseDecimals(showDecimals, skipDecimalsForCurrency);
      
      if (shouldUseDecimals) {
        formatOptions.minimumFractionDigits = 2;
        formatOptions.maximumFractionDigits = 2;
      } else {
        formatOptions.minimumFractionDigits = 0;
        formatOptions.maximumFractionDigits = 0;
      }
      
      return new Intl.NumberFormat(locale, formatOptions).format(value);
    };
  }, [
    settings?.currency, 
    localCurrencyCode,
    currencyContext.currencyCode, 
    currencyContext.currencyLocale
  ]);
  
  /**
   * Get the symbol for the current currency
   */
  const currencySymbol = useMemo(() => {
    return currencyContext.currencySymbol || currencyData.symbol;
  }, [currencyData, currencyContext.currencySymbol]);
  
  /**
   * Get the locale corresponding to the current currency
   */
  const currencyLocale = useMemo(() => {
    // Prioritize context value
    if (currencyContext.currencyLocale) {
      return currencyContext.currencyLocale;
    }
    
    const currencyCode = currencyContext.currencyCode || localCurrencyCode || settings?.currency || 'USD';
    
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
  }, [settings?.currency, localCurrencyCode, currencyContext]);
  
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
  
  // Provide a function to force refresh from components if needed
  const refreshCurrency = useCallback(() => {
    safeUpdate();
    // Only call context force refresh if it's not being called too frequently
    if (Date.now() - lastUpdateTimeRef.current > 500) {
      currencyContext.forceRefreshCurrency();
    }
  }, [currencyContext, safeUpdate]);
  
  return {
    formatCurrency,
    formatNumber,
    formatPercent,
    currencyCode: currencyContext.currencyCode || localCurrencyCode || settings?.currency || 'USD',
    currencySymbol,
    currencyData,
    currencyLocale,
    refreshCurrency,
    forceRefreshCurrency: currencyContext.forceRefreshCurrency
  };
} 