import { useState, useEffect } from 'react';

type ColorMode = 'light' | 'dark';

interface UserSettings {
  colorMode: ColorMode;
  notifications: boolean;
  currency: string;
  language: string;
}

const defaultSettings: UserSettings = {
  colorMode: 'light',
  notifications: true,
  currency: 'USD',
  language: 'en',
};

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
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
  }, []);

  // Function to update settings
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      if (!prev) return { ...defaultSettings, ...newSettings };
      
      const updatedSettings = { ...prev, ...newSettings };
      
      // Save to localStorage
      try {
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      } catch (error) {
        console.error('Failed to save user settings:', error);
      }
      
      return updatedSettings;
    });
  };

  return {
    settings,
    isLoading,
    updateSettings,
  };
}

export default useUserSettings; 