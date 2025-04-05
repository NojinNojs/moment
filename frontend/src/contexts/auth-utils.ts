import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Define user settings type
export interface UserSettings {
  currency: string;
  language: string;
  colorMode: 'light' | 'dark';
  notifications: boolean;
}

// Define user type
export interface User {
  id: string;
  name: string;
  email: string;
  settings?: UserSettings;
  createdAt?: string;
  updatedAt?: string;
}

// Define auth context type
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<boolean>;
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 