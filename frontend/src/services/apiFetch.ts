/**
 * API Service using Fetch API
 * 
 * This service handles all API communication with the backend using the Fetch API,
 * including authentication, request/response handling, and error handling.
 */

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || '';

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

// Auth response type
interface AuthResponse {
  token: string;
  user: User;
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
    // Build URL with query parameters
    let url = `${API_URL}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API GET Request: ${url}`);
    }
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.createHeaders(),
        credentials: 'include', // Include cookies for CSRF
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async post<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API POST Request: ${API_URL}${endpoint}`, data);
    }
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: this.createHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include', // Include cookies for CSRF
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async put<T>(endpoint: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API PUT Request: ${API_URL}${endpoint}`, data);
    }
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.createHeaders(),
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include', // Include cookies for CSRF
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API DELETE Request: ${API_URL}${endpoint}`);
    }
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.createHeaders(),
        credentials: 'include', // Include cookies for CSRF
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Authentication methods
   */
  public async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/login', { email, password });
    
    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  public async register(userData: { name: string; email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/register', userData);
    
    if (response.success && response.data?.token) {
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
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