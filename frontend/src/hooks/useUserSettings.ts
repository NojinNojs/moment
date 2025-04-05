import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-utils';
import { detectUserCurrency } from '@/lib/utils';

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
          setSettings(user.settings);
          setIsLoading(false);
          return;
        }
        
        // Otherwise, try to get from localStorage
        const storedSettings = localStorage.getItem('userSettings');
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        } else {
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [isAuthenticated, user]);

  // Function to update settings
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      // If user is authenticated, update settings in backend
      if (isAuthenticated) {
        const success = await updateUserSettings(newSettings);
        if (!success) {
          console.error('Failed to update user settings in backend');
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
            console.error('Failed to save user settings to localStorage:', error);
          }
        }
        
        return updatedSettings;
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  return {
    settings,
    isLoading,
    updateSettings,
  };
}

export default useUserSettings; 