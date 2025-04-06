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
import { EventBus } from '@/lib/utils';
import { UserSettings } from '@/contexts/auth-utils';

// Define User type inline to avoid dependency on missing module
interface User {
  id: string;
  name: string;
  email: string;
  settings?: UserSettings;
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
  private isFetchingToken: boolean = false;

  // Add caching for accounts and categories
  private accountsCache: Record<string, Asset> = {};
  private categoriesCache: Record<string, Category> = {};
  private cachedResponses: Record<string, ApiResponse<unknown>> = {}; // Cache for API responses

  constructor() {
    // Create axios instance with default config
    this.axios = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': API_KEY // Always include API key in default headers
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

    // Immediately fetch a CSRF token when service is initialized
    this.fetchCsrfToken().catch(err => {
      console.warn('Failed to fetch initial CSRF token:', err);
    });
  }

  /**
   * Fetch a CSRF token from the server
   */
  public async fetchCsrfToken(): Promise<string | null> {
    // Prevent multiple simultaneous token fetches
    if (this.isFetchingToken) {
      return this.csrfToken;
    }

    this.isFetchingToken = true;
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
    } finally {
      this.isFetchingToken = false;
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
      // Double-check API key is always in headers
      config.headers.set('X-API-Key', API_KEY);
    }

    // Add CSRF token if available and method is not GET
    if (this.csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set('X-CSRF-Token', this.csrfToken);
      }
    }

    // Log requests in development
    if (import.meta.env.DEV) {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, { 
        data: config.data, 
        params: config.params,
        headers: config.headers
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

    // Handle network errors
      return Promise.reject({ 
        success: false, 
      message: 'Network error occurred. Please check your connection.'
    });
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
    console.log(`🌐 API Request: DELETE ${url}`, { data: undefined, params: undefined, headers: this.axios.defaults.headers });
    try {
      const response = await this.axios.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      console.error(`Error in delete request to ${url}:`, error);
      
      // For permanent deletions, handle 404 as success (entity already gone)
      // This prevents UI errors when trying to delete something already gone
      if (url.includes('/permanent')) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          console.log(`🔵 Resource at ${url} not found - treating as successful deletion`);
          return {
            success: true,
            message: 'Resource successfully removed'
          } as ApiResponse<T>;
        }
      }
      
      return this.handleServiceError<T>(`Failed to delete resource at ${url}`, error);
    }
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
    try {
      // If balance is being updated to a negative value, reject
      if (assetData.balance !== undefined && assetData.balance < 0) {
        return {
          success: false,
          message: 'Asset balance cannot be negative',
          errors: {
            balance: 'Balance cannot be negative'
          }
        };
      }
      
      const response = await this.put<Asset>(`/assets/${id}`, assetData as Record<string, unknown>);
      
      // Update cache if successful
      if (response.success && response.data) {
        this.accountsCache[id] = response.data;
      }
      
      return response;
    } catch (error) {
      return this.handleServiceError<Asset>('Failed to update asset', error);
    }
  }

  // Delete asset with transaction impact validation
  public async deleteAsset(id: string): Promise<ApiResponse<void>> {
    try {
      // Check if asset has associated transactions
      const transactions = await this.getTransactions({
        resolveReferences: true
      });
      
      if (transactions.success && transactions.data) {
        const linkedTransactions = transactions.data.filter(t => {
          if (typeof t.account === 'object' && t.account) {
            // Use proper type for account object
            const accountObj = t.account as { _id?: string; id?: string | number };
            return accountObj._id === id || accountObj.id?.toString() === id;
          }
          return t.account === id;
        });
        
        // If there are linked transactions, warn the user but proceed (soft delete)
        if (linkedTransactions.length > 0) {
          console.warn(`Deleting asset with ${linkedTransactions.length} linked transactions`);
        }
      }
      
      // Process deletion request
      const response = await this.delete<void>(`/assets/${id}`);
      
      // Update cache if successful
      if (response.success) {
        if (this.accountsCache[id]) {
          // Mark as deleted in cache
          this.accountsCache[id] = {
            ...this.accountsCache[id],
            isDeleted: true
          };
        }
      }
      
      return response;
    } catch (error) {
      return this.handleServiceError<void>('Failed to delete asset', error);
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

  // Create an asset transfer with balance validation
  public async createAssetTransfer(transferData: {
    fromAsset: string;
    toAsset: string;
    amount: number;
    description?: string;
    date?: string;
  }): Promise<ApiResponse<AssetTransfer>> {
    try {
      // Validate source asset has sufficient balance
      const fromAssetResponse = await this.getAssetById(transferData.fromAsset);
      
      if (!fromAssetResponse.success || !fromAssetResponse.data) {
        return {
          success: false,
          message: 'Source asset not found',
          errors: {
            fromAsset: 'Source asset not found or is unavailable'
          }
        };
      }
      
      const fromAsset = fromAssetResponse.data;
      
      // Check if source asset is deleted
      if (fromAsset.isDeleted) {
        return {
          success: false,
          message: 'Cannot transfer from a deleted asset',
          errors: {
            fromAsset: 'Source asset has been deleted'
          }
        };
      }
      
      // Check if transfer amount exceeds source asset balance
      if (transferData.amount > fromAsset.balance) {
        return {
          success: false,
          message: `Insufficient funds in ${fromAsset.name}. Available balance: ${fromAsset.balance.toFixed(2)}`,
          errors: {
            amount: `Transfer amount exceeds available balance of ${fromAsset.balance.toFixed(2)}`
          }
        };
      }
      
      // Validate destination asset exists and is not deleted
      const toAssetResponse = await this.getAssetById(transferData.toAsset);
      
      if (!toAssetResponse.success || !toAssetResponse.data) {
        return {
          success: false,
          message: 'Destination asset not found',
          errors: {
            toAsset: 'Destination asset not found or is unavailable'
          }
        };
      }
      
      if (toAssetResponse.data.isDeleted) {
        return {
          success: false,
          message: 'Cannot transfer to a deleted asset',
          errors: {
            toAsset: 'Destination asset has been deleted'
          }
        };
      }
      
      // Proceed with creating the transfer if validation passes
      const response = await this.post<AssetTransfer>('/assets/transfers', transferData as unknown as Record<string, unknown>);
      
      // Update local caches if transfer was successful
      if (response.success) {
        await this.preloadEntityData();
      }
      
      return response;
    } catch (error) {
      return this.handleServiceError<AssetTransfer>('Failed to create asset transfer', error);
    }
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
  
  // Create a new transaction with balance validation
  public async createTransaction(transactionData: CreateTransactionDto): Promise<ApiResponse<Transaction>> {
    try {
      // If this is an expense, validate account has sufficient balance
      if (transactionData.type === 'expense' && transactionData.account) {
        const accountId = transactionData.account as string;
        const accountResponse = await this.getAccountById(accountId);
        
        if (accountResponse.success && accountResponse.data) {
          const account = accountResponse.data;
          const amount = Math.abs(Number(transactionData.amount));
          
          // Check if expense is greater than account balance
          if (amount > account.balance) {
            return {
              success: false,
              message: `Insufficient funds in ${account.name}. Available balance: ${account.balance.toFixed(2)}`,
              errors: {
                amount: `Cannot create expense larger than available balance of ${account.balance.toFixed(2)}`
              }
            };
          }
        }
      }
      
      // Proceed with creating the transaction if validation passes
      const response = await this.post<Transaction>('/transactions', transactionData as unknown as Record<string, unknown>);
      
      // Update local account cache if transaction created successfully
      if (response.success && response.data) {
        // First, preload all entity data to update the service cache
        await this.preloadEntityData();
        
        // But ALSO update localStorage directly for immediate access by TransactionItem
        // Get fresh data from cache for accounts and categories
        try {
          // Get all assets and store in localStorage
          const accountsResponse = await this.getAssets();
          if (accountsResponse.success && accountsResponse.data) {
            localStorage.setItem('user_assets', JSON.stringify(accountsResponse.data));
            console.log(`[API] Updated user_assets in localStorage with ${accountsResponse.data.length} items`);
          }
          
          // Get all categories and store in localStorage
          const categoriesResponse = await this.getCategories();
          if (categoriesResponse.success && categoriesResponse.data) {
            localStorage.setItem('user_categories', JSON.stringify(categoriesResponse.data));
            console.log(`[API] Updated user_categories in localStorage with ${categoriesResponse.data.length} items`);
          }
          
          // If the transaction has a category ID, also store specifically for that ID
          if (transactionData.category && typeof transactionData.category === 'string') {
            const categoryId = transactionData.category;
            const categoryResponse = await this.getCategoryById(categoryId);
            
            if (categoryResponse.success && categoryResponse.data) {
              localStorage.setItem(`category_${categoryId}`, JSON.stringify(categoryResponse.data));
              console.log(`[API] Cached specific category in localStorage: ${categoryResponse.data.name}`);
            }
          }
          
          // If the transaction has an account ID, also store specifically for that ID
          if (transactionData.account && typeof transactionData.account === 'string') {
            const accountId = transactionData.account;
            const accountResponse = await this.getAccountById(accountId);
            
            if (accountResponse.success && accountResponse.data) {
              localStorage.setItem(`account_${accountId}`, JSON.stringify(accountResponse.data));
              console.log(`[API] Cached specific account in localStorage: ${accountResponse.data.name}`);
            }
          }
        } catch (error) {
          console.error('[API] Error updating localStorage with fresh entity data:', error);
        }
      }
      
      return response;
    } catch (error) {
      return this.handleServiceError<Transaction>('Failed to create transaction', error);
    }
  }
  
  /**
   * Update a transaction with improved reference resolution
   */
  public async updateTransaction(
    id: string, 
    data: Partial<Transaction> & {
      originalType?: 'income' | 'expense';
      originalAmount?: number;
    }
  ): Promise<ApiResponse<Transaction>> {
    try {
      console.log('Updating transaction with data:', { id, data });
      
      // Copy data to avoid mutation and prepare request data
      const requestData: Record<string, unknown> = {};
      
      // Only include fields that are defined and not null
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'originalType' && key !== 'originalAmount') {
          // Handle account and category that could be objects or strings
          if (key === 'account') {
            if (typeof value === 'object' && value !== null) {
              // @ts-expect-error This is fine to use null filters here
              requestData[key] = value._id || value.id;
            } else {
              requestData[key] = value; // String ID directly
            }
          } else if (key === 'category') {
            if (typeof value === 'object' && value !== null) {
              // @ts-expect-error This is fine to use null filters here
              requestData[key] = value._id || value.id;
            } else {
              requestData[key] = value; // String ID directly
            }
          } else {
            requestData[key] = value;
          }
        }
      });
      
      console.log('Prepared request data:', requestData);
      
      const response = await this.put<Transaction>(`/transactions/${id}`, requestData);
      console.log('Update transaction response:', response);
      
      // If update was successful, clear all relevant cached data to ensure fresh state
      if (response.success) {
        // Invalidate cached data to ensure we get fresh data on next request
        delete this.cachedResponses['/transactions'];
        delete this.cachedResponses['/assets'];
        
        // Reload entity data to ensure our caches are up-to-date
        await this.preloadEntityData();
        
        // ALSO UPDATE LOCALSTORAGE for immediate access by TransactionItem component
        try {
          // Get all assets and store in localStorage
          const accountsResponse = await this.getAssets();
          if (accountsResponse.success && accountsResponse.data) {
            localStorage.setItem('user_assets', JSON.stringify(accountsResponse.data));
            console.log(`[API] Updated user_assets in localStorage with ${accountsResponse.data.length} items`);
          }
          
          // Get all categories and store in localStorage
          const categoriesResponse = await this.getCategories();
          if (categoriesResponse.success && categoriesResponse.data) {
            localStorage.setItem('user_categories', JSON.stringify(categoriesResponse.data));
            console.log(`[API] Updated user_categories in localStorage with ${categoriesResponse.data.length} items`);
          }
          
          // If the transaction update included a category, cache it specifically
          if (data.category) {
            const categoryId = typeof data.category === 'object' && data.category !== null
              ? ((data.category as { _id?: string; id?: string | number })._id || (data.category as { _id?: string; id?: string | number }).id) 
              : data.category;
              
            if (categoryId && typeof categoryId === 'string') {
              const categoryResponse = await this.getCategoryById(categoryId);
              if (categoryResponse.success && categoryResponse.data) {
                localStorage.setItem(`category_${categoryId}`, JSON.stringify(categoryResponse.data));
                console.log(`[API] Cached updated category in localStorage: ${categoryResponse.data.name}`);
              }
            }
          }
          
          // If the transaction update included an account, cache it specifically
          if (data.account) {
            const accountId = typeof data.account === 'object' && data.account !== null
              ? ((data.account as { _id?: string; id?: string | number })._id || (data.account as { _id?: string; id?: string | number }).id) 
              : data.account;
              
            if (accountId && typeof accountId === 'string') {
              const accountResponse = await this.getAccountById(accountId);
              if (accountResponse.success && accountResponse.data) {
                localStorage.setItem(`account_${accountId}`, JSON.stringify(accountResponse.data));
                console.log(`[API] Cached updated account in localStorage: ${accountResponse.data.name}`);
              }
            }
          }
        } catch (error) {
          console.error('[API] Error updating localStorage with fresh entity data:', error);
        }
        
        // Broadcast that a transaction was updated so UI components can refresh
        EventBus.emit('transaction.updated', {
          transaction: response.data,
          typeChanged: data.type !== undefined,
          originalType: data.originalType,
          newType: data.type,
          originalAmount: data.originalAmount,
          newAmount: data.amount
        });
      }
      
      // If update was successful and we need to return the transaction with resolved references
      if (response.success && response.data) {
        const transaction = response.data;
        
        // Create a copy of the transaction to avoid mutating the response directly
        const enhancedTransaction = { ...transaction } as Transaction;
        
        // Resolve account reference if it's a MongoDB ID
        if (typeof enhancedTransaction.account === 'string' && 
            /^[0-9a-f]{24}$/i.test(enhancedTransaction.account) && 
            this.accountsCache[enhancedTransaction.account]) {
          // Use type assertion to fix type error
          enhancedTransaction.account = this.accountsCache[enhancedTransaction.account] as unknown as string;
        }
        
        // Resolve category reference if it's a MongoDB ID
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
      console.error('Error in updateTransaction:', error);
      return this.handleServiceError<Transaction>('Failed to update transaction', error);
    }
  }
  
  // Delete a transaction (soft delete) with account balance update
  public async deleteTransaction(id: string): Promise<ApiResponse<void>> {
    console.log(`Attempting to soft delete transaction with ID: ${id}, type: ${typeof id}`);
    try {
      if (!id) {
        console.error('deleteTransaction called with empty ID');
        return {
          success: false,
          message: 'Invalid transaction ID',
        };
      }
      
      // First get the transaction details to know how to update account balance
      const transactionResponse = await this.getTransactionById(id);
      
      // Log details of the transaction we're trying to delete
      if (transactionResponse.success && transactionResponse.data) {
        console.log('Transaction details before deletion:', {
          id: transactionResponse.data.id,
          _id: transactionResponse.data._id,
          title: transactionResponse.data.title
        });
      }
      
      // Proceed with deletion
      const response = await this.delete<void>(`/transactions/${id}`);
      
      // If deletion was successful, update account caches
      if (response.success) {
        await this.preloadEntityData();
      }
      
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
    console.log(`Attempting to permanently delete transaction with ID: ${id}, type: ${typeof id}`);
    try {
      if (!id) {
        console.error('permanentDeleteTransaction called with empty ID');
        return {
          success: false,
          message: 'Invalid transaction ID',
        };
      }
      
      // Log exactly what ID we're using for the API call
      console.log(`Sending permanent delete API request to: /transactions/${id}/permanent`);
      
      try {
        const response = await this.delete<void>(`/transactions/${id}/permanent`);
        
        if (response.success) {
          // Clear all cached data to ensure fresh data is loaded
          await this.preloadEntityData();
          console.log(`Transaction permanently deleted: ${id}`);
        } else {
          console.error(`Failed to permanently delete transaction: ${id}`, response.message);
        }
        
        return response;
      } catch (error: unknown) {
        // Special handling for 404 errors - treat as success for UI purposes
        // The transaction is already gone, which was the end goal
        const axiosError = error as { response?: { status?: number } };
        const errorWithMessage = error as { message?: string };
        
        if (axiosError.response?.status === 404 || 
            (errorWithMessage.message && errorWithMessage.message.includes('not found'))) {
          console.log(`Transaction ${id} not found during permanent delete - treating as success`);
          return {
            success: true,
            message: 'Transaction successfully removed',
          };
        }
        
        // Re-throw other errors
        throw error;
      }
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
    if (!id) {
      console.error("Invalid transaction ID for restoration");
      return {
        success: false,
        message: "Invalid transaction ID"
      };
    }

    console.log(`Attempting to restore transaction: ${id}, type: ${typeof id}`);
    // Show ID format for debugging
    if (id && typeof id === 'string') {
      console.log(`ID format check - numeric?: ${!isNaN(Number(id))}, length: ${id.length}, hex?: ${/^[0-9a-f]{24}$/i.test(id)}`);
    }
    
    try {
      const response = await this.put<Transaction>(`/transactions/${id}/restore`, {});
      
      if (response.success) {
        // Clear all cached data to ensure fresh data is loaded
        await this.preloadEntityData();
        console.log(`Transaction restored: ${id}`);
      }
      
      return response;
    } catch (error) {
      console.error(`Error restoring transaction: ${id}`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to restore transaction"
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

  /**
   * User Settings Methods
   */
  
  // Get user settings
  public async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      return this.get<UserSettings>('/auth/settings');
    } catch (error) {
      return this.handleServiceError<UserSettings>('Failed to fetch user settings', error);
    }
  }
  
  // Update user settings
  public async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      return this.put<UserSettings>('/auth/settings', settings);
    } catch (error) {
      return this.handleServiceError<UserSettings>('Failed to update user settings', error);
    }
  }
}

// Create and export single instance of API service
const apiService = new ApiService();
export default apiService; 