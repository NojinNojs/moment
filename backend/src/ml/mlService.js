/**
 * ML Service Client
 * 
 * This module provides a client for interacting with the machine learning service.
 * It handles prediction requests, error handling, caching, and monitoring.
 */

const axios = require('axios');
const { logger } = require('../utils/logger');

// Cache configuration
const PREDICTION_CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum number of cache entries

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_REQUEST_TIMEOUT = parseInt(process.env.ML_REQUEST_TIMEOUT || '5000', 10);
const ENABLE_CACHE = process.env.ENABLE_ML_CACHE !== 'false';

// ML Service endpoint constants
const ML_PREDICT_ENDPOINT = '/api/v1/predict';
const ML_HEALTH_ENDPOINT = '/api/v1/health';
const ML_CATEGORIES_ENDPOINT = '/api/v1/categories';

// Create axios instance for ML Service
const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Default categories for fallback
const DEFAULT_INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Gift", "Refund", "Bonus", "Allowance", "Small Business", "Rental", "Dividend", "Pension", "Asset Sale", "Other"];
const DEFAULT_EXPENSE_CATEGORIES = ["Food & Dining", "Transportation", "Housing", "Utilities", "Internet & Phone", "Healthcare", "Entertainment", "Shopping", "Travel", "Education", "Debt Payment", "Charitable Giving", "Family Support", "Tax", "Insurance", "Subscriptions", "Personal Care", "Vehicle Maintenance", "Clothing", "Electronics", "Other"];

/**
 * Generate cache key for predictions
 * @param {string} text - Text to predict
 * @param {string} type - Transaction type (income/expense)
 * @returns {string} Cache key
 */
const getCacheKey = (text, type) => {
  return `${text.toLowerCase().trim()}_${type || 'any'}`;
};

/**
 * Check ML service health
 * @returns {Promise<boolean>} True if service is healthy
 */
const checkHealth = async () => {
  try {
    const response = await mlClient.get(ML_HEALTH_ENDPOINT);
    return response.data.status === 'ok';
  } catch (error) {
    logger.error(`ML Service health check failed: ${error.message}`);
    return false;
  }
};

/**
 * Get detailed health information from ML service
 * @returns {Promise<Object>} Detailed health information
 */
const getDetailedHealth = async () => {
  try {
    const response = await mlClient.get(ML_HEALTH_ENDPOINT);
    return {
      status: response.data.status || 'unknown',
      timestamp: response.data.timestamp || new Date().toISOString(),
      components: response.data.components || {
        model: response.data.status === 'ok' ? 'healthy' : 'unhealthy',
        api: 'healthy'
      },
      version: response.data.version || '1.0.0'
    };
  } catch (error) {
    logger.error(`Failed to get detailed health info: ${error.message}`);
    throw error;
  }
};

/**
 * Get available categories from ML service
 * @returns {Promise<Object>} Categories object with income and expense lists
 */
const getCategories = async () => {
  try {
    const response = await mlClient.get(ML_CATEGORIES_ENDPOINT);
    return {
      income: response.data.income_categories,
      expense: response.data.expense_categories
    };
  } catch (error) {
    logger.error(`Failed to get categories from ML service: ${error.message}`);
    
    // Return fallback categories
    return {
      income: DEFAULT_INCOME_CATEGORIES,
      expense: DEFAULT_EXPENSE_CATEGORIES
    };
  }
};

/**
 * Maintain cache size by removing oldest entries when exceeded
 */
const maintainCacheSize = () => {
  if (PREDICTION_CACHE.size > MAX_CACHE_SIZE) {
    // Find oldest entries
    const entries = Array.from(PREDICTION_CACHE.entries());
    const oldestEntries = entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, Math.ceil(MAX_CACHE_SIZE * 0.2)); // Remove oldest 20%
    
    // Delete oldest entries
    for (const [key] of oldestEntries) {
      PREDICTION_CACHE.delete(key);
    }
    
    logger.info(`Cache pruned. Removed ${oldestEntries.length} oldest entries.`);
  }
};

/**
 * Get cached prediction if available and not expired
 * @param {string} cacheKey - Cache key for prediction
 * @returns {Object|null} Cached prediction or null if not found/expired
 */
const getCachedPrediction = (cacheKey) => {
  if (!ENABLE_CACHE) return null;
  
  const cached = PREDICTION_CACHE.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    // Remove expired cache entry
    PREDICTION_CACHE.delete(cacheKey);
    return null;
  }
  
  return cached.prediction;
};

/**
 * Store prediction in cache
 * @param {string} cacheKey - Cache key for prediction
 * @param {Object} prediction - Prediction to cache
 */
const cachePrediction = (cacheKey, prediction) => {
  if (!ENABLE_CACHE) return;
  
  PREDICTION_CACHE.set(cacheKey, {
    prediction,
    timestamp: Date.now()
  });
  
  // Maintain cache size
  maintainCacheSize();
};

/**
 * Get fallback prediction when ML service fails
 * @param {string} type - Transaction type (income/expense)
 * @returns {Object} Fallback prediction object
 */
const getFallbackPrediction = (type) => {
  const defaultCategory = type === 'income' ? 'Other' : 'Other';
  
  return {
    primary_category: {
      category: defaultCategory,
      confidence: 0.5
    },
    alternative_categories: [],
    is_fallback: true
  };
};

/**
 * Predict category for transaction text
 * @param {string} text - Transaction text to classify
 * @param {string} type - Transaction type (income/expense)
 * @returns {Promise<Object>} Prediction result
 */
const predictCategory = async (text, type) => {
  // Validate input
  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Text is required for prediction');
  }
  
  // Check if type is valid
  if (type && !['income', 'expense'].includes(type)) {
    throw new Error('Type must be either "income", "expense", or empty');
  }
  
  // Start timing for metrics
  const startTime = Date.now();
  
  try {
    // Generate cache key
    const cacheKey = getCacheKey(text, type);
    
    // Check cache first
    const cachedResult = getCachedPrediction(cacheKey);
    if (cachedResult) {
      logger.debug(`Using cached prediction for: ${text}`);
      return {
        ...cachedResult,
        source: 'cache'
      };
    }
    
    // First check if ML service is healthy
    const isHealthy = await checkHealth().catch(() => false);
    if (!isHealthy) {
      logger.warn('ML Service is not healthy, using fallback prediction');
      const fallback = getFallbackPrediction(type);
      return {
        ...fallback,
        source: 'fallback',
        error_message: 'ML Service is not available'
      };
    }
    
    // Prepare request to ML service
    const requestData = {
      text: text.trim(),
      ...(type && { type })
    };
    
    // Call ML service
    const response = await mlClient.post(ML_PREDICT_ENDPOINT, requestData);
    
    // Extract prediction data from the new response format
    const predictionData = response.data.data;
    
    // Ensure we have the required fields
    if (!predictionData || !predictionData.primary_category) {
      throw new Error('Invalid response from ML service');
    }
    
    // Cache successful prediction
    cachePrediction(cacheKey, predictionData);
    
    // Log metrics
    const duration = Date.now() - startTime;
    logger.debug(`ML prediction completed in ${duration}ms for text: ${text}`);
    
    return {
      ...predictionData,
      source: 'ml_service',
      request_id: response.data.request_id,
      model_version: response.data.metadata?.model_version || '1.0.0'
    };
  } catch (error) {
    // Log error
    logger.error(`ML prediction failed: ${error.message}`);
    
    // Use fallback prediction
    const fallback = getFallbackPrediction(type);
    
    return {
      ...fallback,
      source: 'fallback',
      error_message: error.message
    };
  }
};

module.exports = {
  predictCategory,
  checkHealth,
  getDetailedHealth,
  getCategories
}; 