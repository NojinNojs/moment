/**
 * API Service
 * 
 * This service handles all API communication with the backend,
 * including authentication, request/response interceptors, and error handling.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosHeaders } from 'axios';
import { Asset, AssetTransfer } from '@/types/assets';
import { Transaction, CreateTransactionDto } from '@/types/transactions';
import { Category, CategoryType } from '@/types/categories';

// Define User type inline to avoid dependency on missing module
interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define proper error types instead of using 'any'
interface ValidationErrors {
  [key: string]: string | string[];
}

// Define login/register response data type
interface AuthResponseData {
  token: string;
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationErrors;
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: ValidationErrors;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> extends ApiResponse {
  data: PaginatedResponse<T>;
}

class ApiService {
  private axios: AxiosInstance;
  private csrfToken: string | null = null;

  // Add caching for accounts and categories
  private accountsCache: Record<string, Asset> = {};
  private categoriesCache: Record<string, Category> = {};

  constructor() {
    // Create axios instance with default config
    this.axios = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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

    // Immediately fetch a CSRF token when service is initialized (if CSRF is enabled)
    this.fetchCsrfToken().catch(err => {
      console.warn('Failed to fetch initial CSRF token:', err);
    });
  }

  /**
   * Fetch a CSRF token from the server
   */
  public async fetchCsrfToken(): Promise<string | null> {
    try {
      const response = await this.axios.get<ApiResponse<{csrfToken: string}>>('/auth/csrf-token');
      
      if (response.data?.success && response.data?.data?.csrfToken) {
        this.csrfToken = response.data.data.csrfToken;
        if (import.meta.env.DEV) {
          console.log('CSRF token fetched successfully');
        }
        return this.csrfToken;
      } else if (response.data?.message?.includes('disabled')) {
        // CSRF protection is disabled on the server
        console.log('CSRF protection is disabled on the server');
        return null;
      }
      
      console.warn('Failed to fetch CSRF token:', response.data);
      return null;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      return null;
    }
  }

  /**
   * Request interceptor to add auth token and CSRF token
   */
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Add authorization token if available
    const token = localStorage.getItem('auth_token');
    if (token && config.headers instanceof AxiosHeaders) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    // Add API Key from environment variables to all requests
    if (config.headers instanceof AxiosHeaders) {
      // Set the API key for every request (ensuring it's always there)
      config.headers.set('X-API-Key', API_KEY);
    }

    // Add CSRF token if available
    if (this.csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
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
  private handleRequestError(error: Error): Promise<never> {
    console.error('Request Error:', error);
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
    // Check if this is a CSRF error
    if (error.response?.status === 403 && 
        (error.response?.data?.message?.toLowerCase().includes('csrf') || 
         error.response?.data?.message?.toLowerCase().includes('token'))) {
      console.warn('CSRF token validation failed, attempting to fetch a new token');
      
      // Get a new CSRF token and retry the request
      return this.fetchCsrfToken().then(() => {
        if (error.config) {
          // Add the new CSRF token to the request
          if (error.config.headers && this.csrfToken) {
            error.config.headers['X-CSRF-Token'] = this.csrfToken;
          }
          // Retry the original request
          return this.axios(error.config) as unknown as never;
        }
        return Promise.reject(error);
      }).catch(() => {
        // If fetching a new token fails, reject with the original error
        return Promise.reject(error);
      });
    }
    
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
      // Ensure we have a CSRF token before making the login request
      await this.fetchCsrfToken();
      
      if (import.meta.env.DEV) {
        console.log('Using CSRF token for login:', this.csrfToken || 'CSRF disabled');
      }
      
      // Make login request
      const response = await this.axios.post<ApiResponse<AuthResponseData>>('/auth/login', { email, password });
      
      if (!response.data) {
        return {
          success: false,
          message: 'Invalid server response: missing data',
        };
      }
      
      const responseData = response.data;
      
      if (responseData.success && responseData.data) {
        if (!responseData.data.token) {
          console.error('Login response is missing token:', responseData.data);
          return {
            success: false,
            message: 'Invalid server response: missing token',
            data: {
              token: '',
              user: { id: '', name: '', email: '', createdAt: '', updatedAt: '' }
            }
          };
        }
        
        if (!responseData.data.name || !responseData.data.email || !responseData.data.id) {
          console.error('Login response is missing user fields:', responseData.data);
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
        localStorage.setItem('auth_token', responseData.data.token);
        
        // Extract user data from response
        const userData: User = {
          id: responseData.data.id,
          name: responseData.data.name,
          email: responseData.data.email,
          createdAt: responseData.data.createdAt || '',
          updatedAt: responseData.data.updatedAt || ''
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Format response to match AuthResponse interface
        const formattedResponse: ApiResponse<AuthResponse> = {
          success: true,
          message: responseData.message,
          data: {
            token: responseData.data.token,
            user: userData
          }
        };
        
        console.log('Formatted login response:', formattedResponse);
        return formattedResponse;
      }
      
      // Handle failed login - still provide a properly structured response to prevent null access
      console.error('Login failed:', responseData);
      return {
        success: false,
        message: responseData.message || 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  public async register(userData: { name: string; email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    try {
      // Ensure we have a CSRF token before making the register request
      await this.fetchCsrfToken();
      
      if (import.meta.env.DEV) {
        console.log('Using CSRF token for register:', this.csrfToken || 'CSRF disabled');
      }
      
      // Make register request
      const response = await this.axios.post<ApiResponse<AuthResponseData>>('/auth/register', userData);
      
      if (!response.data) {
        return {
          success: false,
          message: 'Invalid server response: missing data',
        };
      }
      
      const responseData = response.data;
      
      // If the registration was successful and there is data
      if (responseData.success && responseData.data) {
        // Store the auth token
        if (!responseData.data.token) {
          console.error('Register response is missing token:', responseData.data);
          return {
            success: false,
            message: 'Authentication token missing from server response',
          };
        }
        
        localStorage.setItem('auth_token', responseData.data.token);
        
        // Format user data
        const { token, ...userData } = responseData.data;
        
        // Additional validation of required fields
        if (!userData.id || !userData.name || !userData.email) {
          console.error('Register response is missing user fields:', responseData.data);
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
          message: responseData.message || 'Registration successful',
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
      console.error('Registration failed:', responseData);
      return {
        success: false,
        message: responseData.message || 'Registration failed',
      };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      return {
        success: false,
        message: errorMessage
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

  /**
   * Asset Management Methods
   */
  
  // Fetch all assets
  public async getAssets(type?: string): Promise<ApiResponse<Asset[]>> {
    try {
      const response = await this.get<Asset[]>('/assets', type ? { type } : undefined);
      
      // Cache the assets if successful
      if (response.success && response.data) {
        response.data.forEach(asset => {
          if (asset._id) {
            this.accountsCache[asset._id] = asset;
          }
          if (asset.id) {
            this.accountsCache[asset.id] = asset;
          }
        });
      }
      
      return response;
    } catch (error) {
      return this.handleServiceError<Asset[]>('Failed to fetch assets', error);
    }
  }

  // Get a single asset by ID
  public async getAssetById(id: string): Promise<ApiResponse<Asset>> {
    return this.get<Asset>(`/assets/${id}`);
  }

  // Create a new asset
  public async createAsset(assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Asset>> {
    return this.post<Asset>('/assets', assetData);
  }

  // Update an existing asset
  public async updateAsset(id: string, assetData: Partial<Asset>): Promise<ApiResponse<Asset>> {
    return this.put<Asset>(`/assets/${id}`, assetData);
  }

  // Delete an asset (soft delete)
  public async deleteAsset(id: string): Promise<ApiResponse<void>> {
    console.log(`Attempting to delete asset with ID: ${id}`);
    try {
      if (!id) {
        console.error('deleteAsset called with empty ID');
        return {
          success: false,
          message: 'Invalid asset ID',
        };
      }
      
      const response = await this.delete<void>(`/assets/${id}`);
      console.log('Delete asset response:', response);
      return response;
    } catch (error) {
      console.error('Error in deleteAsset:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
  
  // Permanently delete an asset (no recovery possible)
  public async permanentDeleteAsset(id: string): Promise<ApiResponse<void>> {
    console.log(`Attempting to permanently delete asset with ID: ${id}`);
    try {
      if (!id) {
        console.error('permanentDeleteAsset called with empty ID');
        return {
          success: false,
          message: 'Invalid asset ID',
        };
      }
      
      const response = await this.delete<void>(`/assets/${id}/permanent`);
      console.log('Permanent delete asset response:', response);
      return response;
    } catch (error) {
      console.error('Error in permanentDeleteAsset:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // Restore a soft-deleted asset
  public async restoreAsset(id: string): Promise<ApiResponse<Asset>> {
    console.log(`Attempting to restore asset with ID: ${id}`);
    try {
      if (!id) {
        console.error('restoreAsset called with empty ID');
        return {
          success: false,
          message: 'Invalid asset ID',
        };
      }
      
      const response = await this.put<Asset>(`/assets/${id}/restore`, {});
      console.log('Restore asset response:', response);
      return response;
    } catch (error) {
      console.error('Error in restoreAsset:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Asset Transfer Methods
   */
  
  // Get all asset transfers
  public async getAssetTransfers(): Promise<ApiResponse<AssetTransfer[]>> {
    return this.get<AssetTransfer[]>('/assets/transfers');
  }

  // Get a specific asset transfer by ID
  public async getAssetTransferById(id: string): Promise<ApiResponse<AssetTransfer>> {
    return this.get<AssetTransfer>(`/assets/transfers/${id}`);
  }

  // Create a new asset transfer
  public async createAssetTransfer(transferData: {
    fromAsset: string;
    toAsset: string;
    amount: number;
    description?: string;
    date?: string;
  }): Promise<ApiResponse<AssetTransfer>> {
    return this.post<AssetTransfer>('/assets/transfers', transferData);
  }

  /**
   * Transaction Methods
   */
  
  // Get all transactions
  public async getTransactions(params: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    showDeleted?: boolean;
    resolveReferences?: boolean;
  } = {}): Promise<ApiResponse<Transaction[]>> {
    try {
      const queryParams = { ...params };
      
      // Remove resolveReferences from params as the API doesn't expect it
      const shouldResolveReferences = queryParams.resolveReferences;
      delete queryParams.resolveReferences;
      
      console.log("🔍 Fetching transactions with params:", queryParams);
      
      const response = await this.get<Transaction[]>('/transactions', queryParams);
      
      // If we need to resolve references and the response is successful
      if (shouldResolveReferences && response.success && response.data) {
        // Ensure we've preloaded our cache
        if (Object.keys(this.accountsCache).length === 0 || Object.keys(this.categoriesCache).length === 0) {
          await this.preloadEntityData();
        }
        
        // Create a copy of the data to avoid mutating the original
        const resolvedTransactions = [...response.data];
        
        // Process each transaction to resolve references
        for (let i = 0; i < resolvedTransactions.length; i++) {
          const transaction = resolvedTransactions[i];
          
          // Resolve account reference if it's a MongoDB ID
          if (
            transaction.account && 
            typeof transaction.account === 'string' && 
            /^[0-9a-f]{24}$/i.test(transaction.account) && 
            this.accountsCache[transaction.account]
          ) {
            // Cast as Transaction to avoid TypeScript errors when reassigning
            (transaction as Transaction).account = this.accountsCache[transaction.account] as unknown as string;
          }
          
          // Resolve category reference if it's a MongoDB ID
          if (
            transaction.category && 
            typeof transaction.category === 'string' && 
            /^[0-9a-f]{24}$/i.test(transaction.category) &&
            this.categoriesCache[transaction.category]
          ) {
            // Cast as Transaction to avoid TypeScript errors when reassigning
            (transaction as Transaction).category = this.categoriesCache[transaction.category] as unknown as string;
          }
        }
        
        // Update the response with the resolved transactions
        response.data = resolvedTransactions;
        
        // Tambahkan logging detail
        if (response.success && response.data) {
          console.log("📊 Transactions response details:");
          console.log("  - Total transactions:", response.data.length);
          
          // Log ID issues
          const transactionsWithoutId = response.data.filter(t => t.id === undefined || t.id === null);
          console.log("  - Transactions without ID:", transactionsWithoutId.length);
          
          if (transactionsWithoutId.length > 0) {
            console.log("  - First transaction without ID:", transactionsWithoutId[0]);
          }
          
          // Ensure all transactions have an ID
          const enhancedTransactions = response.data.map((transaction, index) => {
            if (transaction.id === undefined || transaction.id === null) {
              // Generate a unique ID based on MongoDB _id if available, or create a random one
              const generatedId = transaction._id 
                ? parseInt(String(transaction._id).substring(0, 8), 16) 
                : Date.now() + index;
                
              return {
                ...transaction,
                id: generatedId
              };
            }
            return transaction;
          });
          
          // Return enhanced transactions
          response.data = enhancedTransactions;
        }
      }
      
      return response;
    } catch (error) {
      console.error("Error in getTransactions:", error);
      return this.handleServiceError<Transaction[]>('Failed to fetch transactions', error);
    }
  }
  
  // Get a transaction by ID
  public async getTransactionById(id: string): Promise<ApiResponse<Transaction>> {
    return this.get<Transaction>(`/transactions/${id}`);
  }
  
  // Create a new transaction
  public async createTransaction(transactionData: CreateTransactionDto): Promise<ApiResponse<Transaction>> {
    return this.post<Transaction>('/transactions', transactionData as unknown as Record<string, unknown>);
  }
  
  /**
   * Update a transaction with improved reference resolution
   */
  public async updateTransaction(
    id: string, 
    data: Partial<Transaction>
  ): Promise<ApiResponse<Transaction>> {
    try {
      console.log('Updating transaction with data:', { id, data });
      
      // Copy data to avoid mutation and prepare request data
      const requestData: Record<string, unknown> = {};
      
      // Only include fields that are defined and not null
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle account dan category yang bisa berupa object atau string
          if (key === 'account') {
            if (typeof value === 'object' && value !== null) {
              // @ts-expect-error This is fine to use null filters here
              requestData[key] = value._id || value.id;
            } else {
              requestData[key] = value; // String ID langsung
            }
          } else if (key === 'category') {
            if (typeof value === 'object' && value !== null) {
              // @ts-expect-error This is fine to use null filters here
              requestData[key] = value._id || value.id;
            } else {
              requestData[key] = value; // String ID langsung
            }
          } else {
            requestData[key] = value;
          }
        }
      });
      
      console.log('Prepared request data:', requestData);
      
      const response = await this.put<Transaction>(`/transactions/${id}`, requestData);
      console.log('Update transaction response:', response);
      
      // If update was successful and we need to return the transaction with resolved references
      if (response.success && response.data) {
        // Ensure our caches are up-to-date
        await this.preloadEntityData();
        
        const transaction = response.data;
        
        // Create a copy of the transaction to avoid mutating the response directly
        const enhancedTransaction = { ...transaction } as Transaction; // Use proper typing
        
        // Resolve account reference if it's a MongoDB ID
        if (
          enhancedTransaction.account && 
          typeof enhancedTransaction.account === 'string' && 
          /^[0-9a-f]{24}$/i.test(enhancedTransaction.account) && 
          this.accountsCache[enhancedTransaction.account]
        ) {
          // Use type assertion to fix type error
          enhancedTransaction.account = this.accountsCache[enhancedTransaction.account] as unknown as string;
        }
        
        // Resolve category reference if it's a MongoDB ID
        if (
          enhancedTransaction.category && 
          typeof enhancedTransaction.category === 'string' && 
          /^[0-9a-f]{24}$/i.test(enhancedTransaction.category) &&
          this.categoriesCache[enhancedTransaction.category]
        ) {
          // Use type assertion to fix type error
          enhancedTransaction.category = this.categoriesCache[enhancedTransaction.category] as unknown as string;
        }
        
        // Ensure id is set (for frontend compatibility)
        if (enhancedTransaction._id && !enhancedTransaction.id) {
          enhancedTransaction.id = enhancedTransaction._id;
        }
        
        console.log('Enhanced transaction after update:', enhancedTransaction);
        
        // Return the enhanced transaction
        return {
          ...response,
          data: enhancedTransaction as Transaction
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return this.handleServiceError<Transaction>('Failed to update transaction', error);
    }
  }
  
  // Delete a transaction (soft delete)
  public async deleteTransaction(id: string): Promise<ApiResponse<void>> {
    console.log(`Attempting to soft delete transaction with ID: ${id}`);
    try {
      if (!id) {
        console.error('deleteTransaction called with empty ID');
        return {
          success: false,
          message: 'Invalid transaction ID',
        };
      }
      
      const response = await this.delete<void>(`/transactions/${id}`);
      console.log('Delete transaction response:', response);
      return response;
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
  
  // Permanently delete a transaction (no recovery possible)
  public async permanentDeleteTransaction(id: string): Promise<ApiResponse<void>> {
    console.log(`Attempting to permanently delete transaction with ID: ${id}`);
    try {
      if (!id) {
        console.error('permanentDeleteTransaction called with empty ID');
        return {
          success: false,
          message: 'Invalid transaction ID',
        };
      }
      
      const response = await this.delete<void>(`/transactions/${id}/permanent`);
      console.log('Permanent delete transaction response:', response);
      return response;
    } catch (error) {
      console.error('Error in permanentDeleteTransaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
  
  // Restore a soft-deleted transaction
  public async restoreTransaction(id: string): Promise<ApiResponse<Transaction>> {
    console.log(`Attempting to restore transaction with ID: ${id}`);
    try {
      if (!id) {
        console.error('restoreTransaction called with empty ID');
        return {
          success: false,
          message: 'Invalid transaction ID',
        };
      }
      
      const response = await this.put<Transaction>(`/transactions/${id}/restore`, {});
      console.log('Restore transaction response:', response);
      
      // If restore was successful, add back to cache if necessary
      if (response.success && response.data) {
        // Ensure our caches are up-to-date
        await this.preloadEntityData();
        
        // Create a copy of the transaction to avoid mutating the response directly
        const enhancedTransaction = { ...response.data } as Transaction;
        
        // Resolve account and category references if needed
        if (typeof enhancedTransaction.account === 'string' && 
            /^[0-9a-f]{24}$/i.test(enhancedTransaction.account) && 
            this.accountsCache[enhancedTransaction.account]) {
          // Use type assertion to fix type error
          enhancedTransaction.account = this.accountsCache[enhancedTransaction.account] as unknown as string;
        }
        
        if (typeof enhancedTransaction.category === 'string' && 
            /^[0-9a-f]{24}$/i.test(enhancedTransaction.category) &&
            this.categoriesCache[enhancedTransaction.category]) {
          // Use type assertion to fix type error
          enhancedTransaction.category = this.categoriesCache[enhancedTransaction.category] as unknown as string;
        }
        
        // Ensure id is set
        if (!enhancedTransaction.id && enhancedTransaction._id) {
          enhancedTransaction.id = enhancedTransaction._id;
        }
        
        return {
          ...response,
          data: enhancedTransaction
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error in restoreTransaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Category Methods
   */
  
  // Get all transaction categories
  public async getCategories(type?: CategoryType): Promise<ApiResponse<Category[]>> {
    try {
      const response = await this.get<Category[]>('/categories', type ? { type } : undefined);
      
      // Cache the categories if successful
      if (response.success && response.data) {
        response.data.forEach(category => {
          if (category._id) {
            this.categoriesCache[category._id] = category;
          }
          if (category.id) {
            this.categoriesCache[category.id] = category;
          }
        });
      }
      
      return response;
    } catch (error) {
      return this.handleServiceError<Category[]>('Failed to fetch categories', error);
    }
  }
  
  // Get a category by ID
  public async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    // Return from cache if available
    if (this.categoriesCache[id]) {
      return {
        success: true,
        message: 'Category fetched from cache',
        data: this.categoriesCache[id]
      };
    }
    
    try {
      const response = await this.get<Category>(`/categories/${id}`);
      if (response.success && response.data) {
        // Cache the category
        this.categoriesCache[id] = response.data;
      }
      return response;
    } catch (error) {
      return this.handleServiceError<Category>('Failed to fetch category', error);
    }
  }

  /**
   * Get account name by ID (with caching)
   */
  public async getAccountById(id: string): Promise<ApiResponse<Asset>> {
    // Return from cache if available
    if (this.accountsCache[id]) {
      return {
        success: true,
        message: 'Account fetched from cache',
        data: this.accountsCache[id]
      };
    }
    
    try {
      const response = await this.get<Asset>(`/assets/${id}`);
      if (response.success && response.data) {
        // Cache the account
        this.accountsCache[id] = response.data;
      }
      return response;
    } catch (error) {
      return this.handleServiceError<Asset>('Failed to fetch account', error);
    }
  }

  /**
   * Pre-load accounts and categories into cache
   */
  public async preloadEntityData(): Promise<void> {
    try {
      // Fetch and cache all accounts
      const accountsResponse = await this.getAssets();
      if (accountsResponse.success && accountsResponse.data) {
        accountsResponse.data.forEach(account => {
          if (account._id) {
            this.accountsCache[account._id] = account;
          }
          if (account.id) {
            this.accountsCache[account.id] = account;
          }
        });
        console.log('Preloaded accounts to cache:', Object.keys(this.accountsCache).length);
      }
      
      // Fetch and cache all categories
      const categoriesResponse = await this.getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        categoriesResponse.data.forEach(category => {
          if (category._id) {
            this.categoriesCache[category._id] = category;
          }
          if (category.id) {
            this.categoriesCache[category.id] = category;
          }
        });
        console.log('Preloaded categories to cache:', Object.keys(this.categoriesCache).length);
      }
    } catch (error) {
      console.error('Error preloading entity data:', error);
    }
  }

  /**
   * Handle service errors with proper typing
   */
  private handleServiceError<T>(message: string, error: unknown): ApiResponse<T> {
    console.error(message, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

// Create and export single instance of API service
const apiService = new ApiService();
export default apiService; 