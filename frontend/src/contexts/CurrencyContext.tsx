import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { detectUserCurrency, saveUserCurrencyPreference, getUserCurrencyPreference, EventBus } from '@/lib/utils';
import { useAuth } from './auth-utils'; // Import auth context from auth-utils
import websocketService from '@/services/websocket';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

// Global variable to track currency outside React lifecycle
// This helps ensure consistency across page navigations
let globalCurrentCurrency = localStorage.getItem('userCurrency') || 'USD';

interface CurrencyContextType {
  currencyCode: string;
  currencySymbol: string;
  currencyLocale: string;
  setCurrency: (code: string) => Promise<void>;
  isLoadingCurrency: boolean;
  forceRefreshCurrency: () => void;
}

const defaultCurrencyContext: CurrencyContextType = {
  currencyCode: globalCurrentCurrency,
  currencySymbol: globalCurrentCurrency === 'IDR' ? 'Rp' : '$',
  currencyLocale: globalCurrentCurrency === 'IDR' ? 'id-ID' : 'en-US',
  setCurrency: async () => {},
  isLoadingCurrency: true,
  forceRefreshCurrency: () => {},
};

const CurrencyContext = createContext<CurrencyContextType>(defaultCurrencyContext);

export const useCurrencyFormat = () => useContext(CurrencyContext);

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currencyCode, setCurrencyCode] = useState<string>(globalCurrentCurrency);
  const [currencySymbol, setCurrencySymbol] = useState<string>(
    globalCurrentCurrency === 'IDR' ? 'Rp' : 
    globalCurrentCurrency === 'EUR' ? '€' : 
    globalCurrentCurrency === 'GBP' ? '£' : '$'
  );
  const [currencyLocale, setCurrencyLocale] = useState<string>(
    globalCurrentCurrency === 'IDR' ? 'id-ID' : 
    globalCurrentCurrency === 'EUR' ? 'de-DE' : 
    globalCurrentCurrency === 'GBP' ? 'en-GB' : 'en-US'
  );
  const [isLoadingCurrency, setIsLoadingCurrency] = useState<boolean>(true);
  const { user } = useAuth();
  const location = useLocation();
  
  // Use refs to prevent infinite loops with useEffect
  const isInitialized = useRef(false);
  const lastCurrencyUpdate = useRef<string | null>(null);
  const previousPath = useRef<string>(location.pathname);
  const isForceRefreshing = useRef(false);
  const lastRefreshTime = useRef(Date.now());

  // Currency maps wrapped in useMemo to prevent unnecessary recreations
  const currencySymbolMap = React.useMemo<Record<string, string>>(() => ({
    USD: '$',
    IDR: 'Rp',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    MYR: 'RM',
  }), []);

  const currencyLocaleMap = React.useMemo<Record<string, string>>(() => ({
    USD: 'en-US',
    IDR: 'id-ID',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    AUD: 'en-AU',
    CAD: 'en-CA',
    SGD: 'en-SG',
    MYR: 'ms-MY',
  }), []);

  // Update all currency related settings based on currency code
  const updateCurrencySettings = useCallback((code: string) => {
    // Skip if trying to set the same value
    if (code === currencyCode && isInitialized.current) {
      console.log(`[CurrencyContext] Skipping duplicate update to: ${code}`);
      return;
    }
    
    console.log(`[CurrencyContext] Updating currency settings to: ${code}`);
    
    // Update global tracking variable first
    globalCurrentCurrency = code;
    
    // Then update state
    setCurrencyCode(code);
    setCurrencySymbol(currencySymbolMap[code] || '$');
    setCurrencyLocale(currencyLocaleMap[code] || 'en-US');
    
    // Also update localStorage for immediate local persistence
    localStorage.setItem('userCurrency', code);
    
    // Only emit change event if this isn't the initial load
    if (isInitialized.current) {
      // Record this update to prevent echo effects
      lastCurrencyUpdate.current = code;
      
      // Emit the event with a small delay to ensure state updates have processed
      // Don't trigger a force refresh here to avoid infinite loops
      setTimeout(() => {
        EventBus.emit('currency:changed', code);
      }, 50);
    } else {
      isInitialized.current = true;
    }
  }, [currencyCode, currencySymbolMap, currencyLocaleMap]);

  // Force refresh function that components can call
  const forceRefreshCurrency = useCallback(() => {
    // Add debounce to prevent excessive refreshes
    const now = Date.now();
    if (now - lastRefreshTime.current < 300) {
      console.log('[CurrencyContext] Skipping refresh, too soon');
      return;
    }
    
    // Prevent recursive refreshes
    if (isForceRefreshing.current) {
      console.log('[CurrencyContext] Already refreshing, skipping duplicate refresh');
      return;
    }
    
    console.log('[CurrencyContext] Force refreshing currency display');
    isForceRefreshing.current = true;
    lastRefreshTime.current = now;
    
    // Use setTimeout to ensure we don't create an infinite loop
    setTimeout(() => {
      // Force the Context to re-render
      setCurrencyCode(current => current);
      isForceRefreshing.current = false;
    }, 0);
  }, []);

  // Listen for path changes to trigger currency refresh
  useEffect(() => {
    // If path changed, make sure currency is up to date
    if (previousPath.current !== location.pathname) {
      console.log(`[CurrencyContext] Path changed from ${previousPath.current} to ${location.pathname}, refreshing currency`);
      previousPath.current = location.pathname;
      
      // When navigating to a new page, force currency reload from global state only if needed
      if (globalCurrentCurrency !== currencyCode) {
        console.log(`[CurrencyContext] Currency mismatch during navigation. Global: ${globalCurrentCurrency}, Local: ${currencyCode}`);
        updateCurrencySettings(globalCurrentCurrency);
      }
    }
  }, [location.pathname, currencyCode, updateCurrencySettings]);

  // Set up WebSocket connection when user is authenticated
  useEffect(() => {
    if (user?.id) {
      console.log(`[CurrencyContext] Setting up WebSocket for user ${user.id}`);
      // Connect to WebSocket
      websocketService.connect(user.id);
      
      // Clean up on unmount
      return () => {
        console.log('[CurrencyContext] Cleaning up WebSocket connection');
        websocketService.disconnect();
      };
    }
  }, [user?.id]);

  // Listen for preference updates from other devices via WebSocket
  useEffect(() => {
    const handlePreferenceUpdate = (data: { preference: string; value: string }) => {
      if (data.preference === 'currency') {
        console.log('[CurrencyContext] Received currency update from another device:', data.value);
        
        // Skip if this is just an echo of our own update
        if (lastCurrencyUpdate.current === data.value) {
          console.log('[CurrencyContext] Ignoring echo of our own update');
          return;
        }
        
        // Skip if currency hasn't changed
        if (data.value === currencyCode) {
          console.log('[CurrencyContext] Current currency already matches, no update needed');
          return;
        }
        
        // Update all currency settings when we receive an update from another device
        updateCurrencySettings(data.value);
        
        // Show a notification to the user
        toast.info(`Currency updated to ${data.value} from another device`);
      }
    };
    
    console.log('[CurrencyContext] Setting up preference:updated event listener');
    
    // Subscribe to preference updates
    EventBus.on('preference:updated', handlePreferenceUpdate);
    
    // Cleanup listener on unmount
    return () => {
      console.log('[CurrencyContext] Removing event listeners');
      EventBus.off('preference:updated', handlePreferenceUpdate);
    };
  }, [currencyCode, updateCurrencySettings]);

  // Load currency preference on component mount or user change
  useEffect(() => {
    // Only run this once or when user changes
    const loadCurrencyPreference = async () => {
      // Don't reload if we're already initialized unless user changed
      if (isInitialized.current && lastCurrencyUpdate.current) {
        console.log('[CurrencyContext] Skipping preference load, already initialized');
        return;
      }
      
      setIsLoadingCurrency(true);
      try {
        console.log('[CurrencyContext] Loading currency preference');
        
        // First check localStorage to avoid unnecessary API calls
        const savedCurrency = localStorage.getItem('userCurrency');
        
        if (savedCurrency) {
          console.log(`[CurrencyContext] Using cached currency from localStorage: ${savedCurrency}`);
          updateCurrencySettings(savedCurrency);
          setIsLoadingCurrency(false);
          
          // Still fetch from server in background for authenticated users
          if (user?.id) {
            try {
              getUserCurrencyPreference(user.id).then(serverCurrency => {
                if (serverCurrency !== savedCurrency) {
                  console.log(`[CurrencyContext] Server currency (${serverCurrency}) differs from localStorage, updating`);
                  updateCurrencySettings(serverCurrency);
                }
              });
            } catch (backgroundError) {
              console.error('[CurrencyContext] Background fetch error:', backgroundError);
            }
          }
          
          return;
        }
        
        // If no localStorage value, get from server or detect
        if (user?.id) {
          // Get currency preference from server
          const currency = await getUserCurrencyPreference(user.id);
          console.log(`[CurrencyContext] Loaded currency preference from server: ${currency}`);
          updateCurrencySettings(currency);
        } else {
          // No user, use detected currency
          const detectedCurrency = detectUserCurrency();
          console.log(`[CurrencyContext] Using detected currency: ${detectedCurrency}`);
          updateCurrencySettings(detectedCurrency);
        }
      } catch (error) {
        console.error('[CurrencyContext] Error loading currency preference:', error);
        // Fallback to default or detected currency
        const detectedCurrency = detectUserCurrency();
        console.log(`[CurrencyContext] Falling back to detected currency: ${detectedCurrency}`);
        updateCurrencySettings(detectedCurrency);
      } finally {
        setIsLoadingCurrency(false);
      }
    };

    loadCurrencyPreference();
  }, [user?.id, updateCurrencySettings]);

  // Set currency and save preference
  const setCurrency = async (code: string) => {
    // Skip if setting to the same value
    if (code === currencyCode) {
      console.log(`[CurrencyContext] Currency already set to ${code}, skipping update`);
      return;
    }
    
    setIsLoadingCurrency(true);
    try {
      console.log(`[CurrencyContext] Setting currency to: ${code}`);
      
      // Update locally first for immediate UI response
      lastCurrencyUpdate.current = code;
      globalCurrentCurrency = code; // Update global tracking variable
      updateCurrencySettings(code);
      
      // Save preference to server and localStorage
      await saveUserCurrencyPreference(code, user?.id);
      
      // Only force refresh once after everything is done
      setTimeout(() => {
        forceRefreshCurrency();
      }, 100);
            
    } catch (error) {
      console.error('[CurrencyContext] Error setting currency:', error);
    } finally {
      setIsLoadingCurrency(false);
    }
  };

  const value = {
    currencyCode,
    currencySymbol,
    currencyLocale,
    setCurrency,
    isLoadingCurrency,
    forceRefreshCurrency,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}; 