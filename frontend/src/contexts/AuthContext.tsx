import { createContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType, UserSettings } from './auth-utils';
import apiService from '@/services/api';
import websocketService from '@/services/websocket';

// Create auth context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        // Check if auth token exists
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Try to get user from localStorage
        const userString = localStorage.getItem('user');
        if (!userString) {
          localStorage.removeItem('auth_token');
          setIsLoading(false);
          return;
        }

        // Parse user data
        const userData = JSON.parse(userString);
        if (!userData || !userData.id) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setIsLoading(false);
          return;
        }

        // Set user data
        setUser(userData);
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = (userData: User, token: string) => {
    // Save token and user to localStorage
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    // Update state
    setUser(userData);
    
    // Connect to WebSocket after login
    if (userData.id) {
      try {
        websocketService.connect(userData.id);
        console.log('WebSocket connection established');
      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
        // Optionally show a toast notification to the user
        toast.warning('Real-time updates might be delayed');
      }
    }
  };

  // Update user settings
  const updateUserSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to update settings');
      return false;
    }

    try {
      // Send settings update to backend
      const response = await apiService.updateUserSettings(newSettings);

      if (response.success && response.data) {
        // Update user state with new settings
        const updatedUser = {
          ...user,
          settings: response.data
        };

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state
        setUser(updatedUser);
        
        toast.success('Settings updated successfully');
        return true;
      } else {
        toast.error(response.message || 'Failed to update settings');
        return false;
      }
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error('An error occurred while updating settings');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Disconnect from WebSocket first
    websocketService.disconnect();
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    // Update state
    setUser(null);
    // Show notification and redirect
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Provide auth context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUserSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 