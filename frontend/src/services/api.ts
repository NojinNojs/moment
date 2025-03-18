/**
 * API Service
 * 
 * This service handles all API communication with the backend,
 * including authentication, request/response interceptors, and error handling.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosHeaders } from 'axios';

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || '';
const API_TIMEOUT = 10000; // 10 seconds

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
const apiService = new ApiService();

export default apiService; 