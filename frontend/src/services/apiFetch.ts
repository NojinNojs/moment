/**
 * API Service using Fetch API
 * 
 * This service handles all API communication with the backend using the Fetch API,
 * including authentication, request/response handling, and error handling.
 */

// Debug environment variables for troubleshooting preview vs dev mode
console.log('Fetch Service - Environment Variables:');
console.log('VITE_API_URL exists:', !!import.meta.env.VITE_API_URL);
console.log('VITE_API_KEY exists:', !!import.meta.env.VITE_API_KEY);
console.log('MODE:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);

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
console.log('Fetch Service - Final API_URL:', API_URL);

const API_KEY = import.meta.env.VITE_API_KEY || '';
const API_TIMEOUT = 30000; // 30 seconds timeout

// Helper function to implement timeout with fetch
const fetchWithTimeout = async (url: string, options: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    return await fetch(url, { ...options, signal });
  } finally {
    clearTimeout(timeout);
  }
};

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

class ApiFetchService {
  private csrfToken: string | null = null;

  /**
   * Create default headers for requests
   */
  private createHeaders(includeAuth = true, includeContent = true): HeadersInit {
    const headers: HeadersInit = {};
    
    if (includeContent) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    
    // Add API key
    headers['X-API-Key'] = API_KEY;
    
    // Add authentication token if available
    if (includeAuth) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    // Add CSRF token for non-GET requests if available
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }
    
    return headers;
  }

  /**
   * Process response from fetch
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // Store CSRF token if present in headers
    const csrfToken = response.headers.get('X-CSRF-Token');
    if (csrfToken) {
      this.csrfToken = csrfToken;
    }
    
    // Parse response JSON
    let responseData: ApiResponse<T>;
    try {
      responseData = await response.json();
    } catch {
      throw new Error('Invalid response format');
    }
    
    // Log responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response (${response.status}):`, responseData);
    }
    
    // Handle error responses
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Clear local storage and redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      
      throw responseData;
    }
    
    return responseData;
  }

  /**
   * Handle request errors
   */
  private handleError(error: unknown): never {
    // If the error is already our API response (from handleResponse), just throw it
    if (error && typeof error === 'object' && 'success' in error && error.success === false) {
      throw error;
    }
    
    // If it's a normal error with a message
    if (error instanceof Error) {
      console.error('API Error:', error.message);
      throw { success: false, message: error.message };
    }
    
    // If it's something else
    console.error('Unexpected API Error:', error);
    throw { success: false, message: 'An unexpected error occurred' };
  }

  /**
   * Helper methods for common HTTP methods
   */
  public async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      // Build URL with query parameters
      let url = `${API_URL}${endpoint}`;
      if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          queryParams.append(key, value);
        });
        url += `?${queryParams.toString()}`;
      }

      // Make fetch request
      const headers = this.createHeaders();
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const url = `${API_URL}${endpoint}`;
      const headers = this.createHeaders();
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.createHeaders(),
        body: data ? JSON.stringify(data) : undefined
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.createHeaders()
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Authentication methods
   */
  public async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('Login request initiated with:', { email });
      const response = await this.post<RawAuthResponse>('/auth/login', { email, password });
      
      console.log('Login raw response:', response);
      
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
      console.log('Register request initiated with:', { name: userData.name, email: userData.email });
      const response = await this.post<RawAuthResponse>('/auth/register', userData);
      
      console.log('Register raw response:', response);
      
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
          console.error('Register response is missing token:', response.data);
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
          console.error('Register response is missing user fields:', response.data);
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
        
        console.log('Formatted register response:', formattedResponse);
        return formattedResponse;
      }
      
      // Handle failed registration - still provide a properly structured response to prevent null access
      console.error('Registration failed:', response);
      return {
        success: false,
        message: response.message || 'Registration failed',
        errors: response.errors,
        data: {
          token: '',
          user: { id: '', name: '', email: '', createdAt: '', updatedAt: '' }
        }
      };
    } catch (error) {
      console.error('Registration exception:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred during registration',
        data: {
          token: '',
          user: { id: '', name: '', email: '', createdAt: '', updatedAt: '' }
        }
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
const apiFetchService = new ApiFetchService();

export default apiFetchService; 