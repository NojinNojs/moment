import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-utils';
import { detectUserCurrency, EventBus } from '@/lib/utils';

type ColorMode = 'light' | 'dark';

export interface UserSettings {
  colorMode: ColorMode;
  notifications: boolean;
  currency: string;
  language: string;
}

const defaultSettings: UserSettings = {
  colorMode: 'light',
  notifications: true,
  currency: typeof window !== 'undefined' ? detectUserCurrency() : 'USD',
  language: 'en',
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, updateUserSettings, isAuthenticated } = useAuth();
  
  // Load settings from user or localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        // If user is authenticated, use their settings from user object
        if (isAuthenticated && user?.settings) {
          console.log('[useUserSettings] Using authenticated user settings:', user.settings);
          setSettings(user.settings);
          setIsLoading(false);
          return;
        }
        
        // Otherwise, try to get from localStorage
        const storedSettings = localStorage.getItem('userSettings');
        if (storedSettings) {
          console.log('[useUserSettings] Using localStorage settings');
          setSettings(JSON.parse(storedSettings));
        } else {
          console.log('[useUserSettings] Using default settings');
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('[useUserSettings] Failed to load user settings:', error);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isAuthenticated, user]);

  // Create a stable callback for currency changes
  const handleCurrencyChange = useCallback((currencyCode: string) => {
    console.log(`[useUserSettings] Received currency change event: ${currencyCode}`);
    
    // Update settings with new currency
    setSettings(prevSettings => {
      if (!prevSettings) return { ...defaultSettings, currency: currencyCode };
      return { ...prevSettings, currency: currencyCode };
    });
  }, []);

  // Listen for currency changes from other components/devices
  useEffect(() => {
    // Subscribe to currency change events
    EventBus.on('currency:changed', handleCurrencyChange);
    
    // Also listen for WebSocket preference updates
    const handlePreferenceUpdate = (data: { preference: string; value: string }) => {
      if (data.preference === 'currency') {
        console.log(`[useUserSettings] Received currency preference update: ${data.value}`);
        handleCurrencyChange(data.value);
      }
    };
    
    EventBus.on('preference:updated', handlePreferenceUpdate);
    
    // Cleanup on unmount
    return () => {
      EventBus.off('currency:changed', handleCurrencyChange);
      EventBus.off('preference:updated', handlePreferenceUpdate);
    };
  }, [handleCurrencyChange]);

  // Function to update settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      console.log('[useUserSettings] Updating settings:', newSettings);
      
      // If user is authenticated, update settings in backend
      if (isAuthenticated) {
        const success = await updateUserSettings(newSettings);
        if (!success) {
          console.error('[useUserSettings] Failed to update user settings in backend');
        }
      }
      
      // Update local state
      setSettings((prev) => {
        if (!prev) return { ...defaultSettings, ...newSettings };
        
        const updatedSettings = { ...prev, ...newSettings };
        
        // If not authenticated, save to localStorage
        if (!isAuthenticated) {
          try {
            localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
          } catch (error) {
            console.error('[useUserSettings] Failed to save user settings to localStorage:', error);
          }
        }
        
        return updatedSettings;
      });
      
      // If updating currency, emit event to force immediate refresh
      if (newSettings.currency) {
        setTimeout(() => {
          EventBus.emit('currency:changed', newSettings.currency);
        }, 0);
      }
    } catch (error) {
      console.error('[useUserSettings] Error updating settings:', error);
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
  };
}

export default useUserSettings; 