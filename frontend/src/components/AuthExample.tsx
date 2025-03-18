import { useState } from 'react';
import apiService from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

// API error interface
interface ApiError {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

// Form validation errors
interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Example component demonstrating API usage with authentication
 */
export default function AuthExample() {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  
  // User state
  const [user, setUser] = useState<User | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;
    
    // Clear previous errors
    setValidationErrors({});
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }
    
    // Name validation (only for registration)
    if (!isLogin && !name) {
      errors.name = 'Name is required';
      isValid = false;
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  // Handle form submission (login or register)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await apiService.login(email, password);
        
        if (response.success && response.data) {
          setUser(response.data.user);
          toast.success("Login successful", {
            description: `Welcome back, ${response.data.user.name}!`,
          });
        }
      } else {
        // Register
        const response = await apiService.register({ name, email, password });
        
        if (response.success && response.data) {
          setUser(response.data.user);
          toast.success("Registration successful", {
            description: `Welcome, ${response.data.user.name}!`,
          });
        }
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      
      // Handle validation errors from API
      if (apiError.errors) {
        const fieldErrors: ValidationErrors = {};
        Object.entries(apiError.errors).forEach(([field, messages]) => {
          fieldErrors[field as keyof ValidationErrors] = messages[0];
        });
        setValidationErrors(fieldErrors);
      }
      
      toast.error("Authentication failed", {
        description: apiError.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get user profile
  const handleGetProfile = async () => {
    setLoading(true);
    
    try {
      const response = await apiService.getProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
        toast.success("Profile retrieved", {
          description: `Hello, ${response.data.name}!`,
        });
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error("Failed to get profile", {
        description: apiError.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    setLoading(true);
    try {
      apiService.logout();
      setUser(null);
      toast.success("Logged out", {
        description: "You have been logged out successfully",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and register forms
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setValidationErrors({});
  };

  return (
    <>
      <Toaster />
      <Card className="w-[350px] mx-auto">
        <CardHeader>
          <CardTitle>{user ? 'Profile' : (isLogin ? 'Login' : 'Register')}</CardTitle>
          <CardDescription>
            {user 
              ? 'Your profile information' 
              : (isLogin ? 'Login to your account' : 'Create a new account')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <Label>Name</Label>
                <div className="p-2 border rounded-md">{user.name}</div>
              </div>
              <div className="flex flex-col space-y-1">
                <Label>Email</Label>
                <div className="p-2 border rounded-md">{user.email}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={loading}
                    className={validationErrors.name ? "border-red-500" : ""}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-red-500">{validationErrors.name}</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className={validationErrors.password ? "border-red-500" : ""}
                />
                {validationErrors.password && (
                  <p className="text-sm text-red-500">{validationErrors.password}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? 'Logging in...' : 'Registering...'}
                  </>
                ) : (
                  isLogin ? 'Login' : 'Register'
                )}
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {user ? (
            <div className="flex space-x-2 w-full">
              <Button 
                onClick={handleGetProfile} 
                variant="outline" 
                className="flex-1" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : 'Refresh Profile'}
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="destructive" 
                className="flex-1" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : 'Logout'}
              </Button>
            </div>
          ) : (
            <Button onClick={toggleForm} variant="outline" className="w-full" disabled={loading}>
              {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
} 