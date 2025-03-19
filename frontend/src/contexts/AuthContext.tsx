import { createContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { User, AuthContextType } from './auth-utils';

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
  };

  // Logout function
  const logout = () => {
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 