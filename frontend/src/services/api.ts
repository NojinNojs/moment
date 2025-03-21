/**
 * API Service
 * 
 * This service handles all API communication with the backend,
 * including authentication, request/response interceptors, and error handling.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosHeaders } from 'axios';

// Debug logging only in development mode
if (import.meta.env.DEV) {
  console.log('Environment Variables:');
  console.log('VITE_API_URL exists:', !!import.meta.env.VITE_API_URL);
  console.log('VITE_API_KEY exists:', !!import.meta.env.VITE_API_KEY);
  console.log('MODE:', import.meta.env.MODE);
  console.log('DEV:', import.meta.env.DEV);
  console.log('PROD:', import.meta.env.PROD);
}

// API configuration
let API_URL = import.meta.env.VITE_API_URL;
// Fallback URL handling for production
if (!API_URL) {
  // Check if we're in production mode
  if (import.meta.env.PROD) {
    console.warn('No VITE_API_URL found in production, using fallback URL');
    API_URL = 'http://localhost:3000/api/v1'; // Use your actual backend URL here
  } else {
    API_URL = 'http://localhost:3000/api/v1'; // Development fallback
  }
}

// Only log API URL in development
if (import.meta.env.DEV) {
  console.log('Final API_URL:', API_URL);
}

const API_KEY = import.meta.env.VITE_API_KEY || '';
const API_TIMEOUT = 30000; // 30 seconds - increased from 10 seconds

// Type for the API response
interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: Record<string, string[]>;
}

// User type definition
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Auth response type from frontend perspective
interface AuthResponse {
  token: string;
  user: User;
}

// Raw auth response type directly from the backend
interface RawAuthResponse {
  id: string;
  name: string;
  email: string;
  token: string;
  createdAt?: string;
  updatedAt?: string;
}

// API error type
interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

class ApiService {
  private axios: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    // Create axios instance with default config
    this.axios = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': API_KEY
      },
      withCredentials: true // Needed for CSRF cookies
    });

    // Add request interceptor
    this.axios.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    );

    // Add response interceptor
    this.axios.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    );
  }

  /**
   * Request interceptor to add auth token and CSRF token
   */
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Add authorization token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Handle as axios headers
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Add CSRF token if available
    if (this.csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      // Handle as axios headers
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('X-CSRF-Token', this.csrfToken);
      }
    }

    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, { 
        data: config.data, 
        params: config.params 
      });
    }

    return config;
  }

  /**
   * Handle request errors
   */
  private handleRequestError(error: unknown): Promise<never> {
    console.error('Request error:', error);
    return Promise.reject(error);
  }

  /**
   * Response interceptor to handle common response processing
   */
  private handleResponse(response: AxiosResponse): AxiosResponse {
    // Store CSRF token if present in headers
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken) {
      this.csrfToken = csrfToken;
    }

    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }

    return response;
  }

  /**
   * Handle response errors
   */
  private handleResponseError(error: AxiosError<ApiResponse>): Promise<never> {
    // Handle specific error cases
    if (error.response) {
      // Server responded with an error status
      const status = error.response.status;
      const data = error.response.data as ApiResponse;

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(`❌ API Error (${status}): ${error.config?.method?.toUpperCase()} ${error.config?.url}`, data);
      }

      // Handle authentication errors
      if (status === 401) {
        // Clear local storage and redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }

      // Return the error data from the server
      return Promise.reject(data || { 
        success: false, 
        message: `Request failed with status code ${status}` 
      });
    }

    if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network Error:', error.message);
      return Promise.reject({ 
        success: false, 
        message: 'Network error. Please check your connection.' 
      } as ApiError);
    }

    // Something else happened in setting up the request
    console.error('Request Error:', error.message);
    return Promise.reject({ 
      success: false, 
      message: error.message || 'An unexpected error occurred'
    } as ApiError);
  }

  /**
   * Helper methods for common HTTP methods
   */
  public async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.axios.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  public async post<T>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.axios.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  public async put<T>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.axios.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  public async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.axios.delete<ApiResponse<T>>(url);
    return response.data;
  }

  /**
   * Authentication methods
   */
  public async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Login request initiated with:', { email });
      }
      
      const response = await this.post<RawAuthResponse>('/auth/login', { email, password });
      
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Login raw response:', response);
      }
      
      // Ensure we have a valid response to work with
      if (!response || typeof response !== 'object') {
        console.error('Invalid response format:', response);
        return {
          success: false,
          message: 'Invalid response format from server',
          data: {
            token: '',
            user: { id: '', name: '', email: '', createdAt: '', updatedAt: '' }
          }
        };
      }
      
      if (response.success && response.data) {
        if (!response.data.token) {
          console.error('Login response is missing token:', response.data);
          return {
            success: false,
            message: 'Invalid server response: missing token',
            data: {
              token: '',
              user: { id: '', name: '', email: '', createdAt: '', updatedAt: '' }
            }
          };
        }
        
        if (!response.data.name || !response.data.email || !response.data.id) {
          console.error('Login response is missing user fields:', response.data);
          return {
            success: false,
            message: 'Invalid server response: missing user data',
            data: {
              token: '',
              user: { id: '', name: '', email: '', createdAt: '', updatedAt: '' }
            }
          };
        }
        
        // Store token
        localStorage.setItem('auth_token', response.data.token);
        
        // Extract user data from response
        const userData: User = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          createdAt: response.data.createdAt || '',
          updatedAt: response.data.updatedAt || ''
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Format response to match AuthResponse interface
        const formattedResponse: ApiResponse<AuthResponse> = {
          success: true,
          message: response.message,
          data: {
            token: response.data.token,
            user: userData
          }
        };
        
        console.log('Formatted login response:', formattedResponse);
        return formattedResponse;
      }
      
      // Handle failed login - still provide a properly structured response to prevent null access
      console.error('Login failed:', response);
      return {
        success: false,
        message: response.message || 'Login failed',
        errors: response.errors,
        data: {
          token: '',
          user: { id: '', name: '', email: '', createdAt: '', updatedAt: '' }
        }
      };
    } catch (error) {
      console.error('Login exception:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred during login',
        data: {
          token: '',
          user: { id: '', name: '', email: '', createdAt: '', updatedAt: '' }
        }
      };
    }
  }

  public async register(userData: { name: string; email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Register request initiated with:', { name: userData.name, email: userData.email });
      }
      
      const response = await this.post<RawAuthResponse>('/auth/register', userData);
      
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.log('Register raw response:', response);
      }
      
      // Ensure we have a valid response to work with
      if (!response || typeof response !== 'object') {
        console.error('Invalid response format:', response);
        return {
          success: false,
          message: 'Invalid response format from server',
        };
      }
      
      // If the registration was successful and there is data
      if (response.success && response.data) {
        // Store the auth token
        if (!response.data.token) {
          console.error('Register response is missing token:', response.data);
          return {
            success: false,
            message: 'Authentication token missing from server response',
          };
        }
        
        localStorage.setItem('auth_token', response.data.token);
        
        // Format user data
        const { token, ...userData } = response.data;
        
        // Additional validation of required fields
        if (!userData.id || !userData.name || !userData.email) {
          console.error('Register response is missing user fields:', response.data);
          return {
            success: false,
            message: 'Incomplete user data in server response',
          };
        }
        
        // Store user data
        const user: User = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        
        // Create formatted response
        const formattedResponse: ApiResponse<AuthResponse> = {
          success: true,
          message: response.message || 'Registration successful',
          data: {
            token,
            user,
          },
        };
        
        // Only log in development mode
        if (import.meta.env.DEV) {
          console.log('Formatted register response:', formattedResponse);
        }
        
        return formattedResponse;
      }
      
      // If we got here, the response indicates failure
      console.error('Registration failed:', response);
      return {
        success: false,
        message: response.message || 'Registration failed',
        errors: response.errors
      } as ApiResponse<AuthResponse>;
    } catch (error) {
      console.error('Registration exception:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred during registration',
      };
    }
  }

  public async getProfile(): Promise<ApiResponse<User>> {
    return this.get<User>('/auth/me');
  }

  public logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService; 