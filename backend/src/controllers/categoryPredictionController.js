/**
 * Category Prediction Controller
 * 
 * Handles requests related to predicting transaction categories
 * using the machine learning service.
 */

const asyncHandler = require('express-async-handler');
const { logger } = require('../utils/logger');
const mlService = require('../ml/mlService');

/**
 * @swagger
 * /categories/predict:
 *   post:
 *     summary: Predict transaction category
 *     description: Uses machine learning to predict the most likely category for a transaction based on its description
 *     tags: [ML Integration]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Transaction description or title
 *                 example: "Grocery shopping at Walmart"
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 description: Transaction type (optional)
 *                 example: "expense"
 *     responses:
 *       200:
 *         description: Category prediction successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category prediction successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     prediction:
 *                       type: object
 *                       properties:
 *                         category:
 *                           type: string
 *                           example: Food & Dining
 *                         confidence:
 *                           type: number
 *                           example: 0.92
 *                     alternative_categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             example: Shopping
 *                           confidence:
 *                             type: number
 *                             example: 0.05
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         source:
 *                           type: string
 *                           example: ml_service
 *                         request_id:
 *                           type: string
 *                           example: pred_20230721_081542
 *                         model_version:
 *                           type: string
 *                           example: "1.0.0"
 *                         is_fallback:
 *                           type: boolean
 *                           example: false
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ServerError'
 */
const predictCategory = asyncHandler(async (req, res) => {
  const { text, type } = req.body;

  // Validate input
  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('Transaction text is required for prediction');
  }

  // Validate transaction type if provided
  if (type && !['income', 'expense'].includes(type)) {
    res.status(400);
    throw new Error('Transaction type must be either "income" or "expense"');
  }

  try {
    // Get prediction from ML service
    const predictionResult = await mlService.predictCategory(text, type);
    
    // Check for fallback result
    if (predictionResult.source === 'fallback') {
      logger.warn(`Using fallback prediction for user ${req.user.id}: ${predictionResult.error_message}`);
    }
    
    // Format response
    const response = {
      success: true,
      message: 'Category prediction successful',
      data: {
        prediction: predictionResult.primary_category,
        alternative_categories: predictionResult.alternative_categories || [],
        metadata: {
          source: predictionResult.source,
          request_id: predictionResult.request_id,
          model_version: predictionResult.model_version || '1.0.0',
          is_fallback: !!predictionResult.is_fallback
        }
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    logger.error(`Category prediction failed: ${error.message}`);
    res.status(500);
    throw new Error(`Failed to predict category: ${error.message}`);
  }
});

/**
 * @swagger
 * /categories/ml/health:
 *   get:
 *     summary: Check ML service health
 *     description: Returns health status of the ML prediction service
 *     tags: [ML Integration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status of ML service
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-07-21T08:15:42.123Z"
 *                     components:
 *                       type: object
 *                       properties:
 *                         model:
 *                           type: string
 *                           example: healthy
 *                         api:
 *                           type: string
 *                           example: healthy
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const getMLServiceHealth = asyncHandler(async (req, res) => {
  try {
    const isHealthy = await mlService.checkHealth();
    
    // Get detailed health data if available
    let healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString()
    };
    
    // Try to get detailed health information if the service is healthy
    if (isHealthy) {
      try {
        const response = await mlService.getDetailedHealth();
        healthData = {
          ...healthData,
          components: response.components || {
            model: isHealthy ? 'healthy' : 'unhealthy',
            api: 'healthy'
          },
          version: response.version || '1.0.0'
        };
      } catch (error) {
        logger.warn(`Could not fetch detailed health data: ${error.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      data: healthData
    });
  } catch (error) {
    logger.error(`ML Service health check failed: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to check ML service health',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /categories/ml/list:
 *   get:
 *     summary: Get ML supported categories
 *     description: Returns list of categories supported by the ML service
 *     tags: [ML Integration]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of supported categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     income:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Salary", "Freelance", "Investment", "Gift", "Refund", "Bonus", "Allowance", "Small Business", "Rental", "Dividend", "Pension", "Asset Sale", "Other"]
 *                     expense:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Food & Dining", "Transportation", "Housing", "Utilities", "Internet & Phone", "Healthcare", "Entertainment", "Shopping", "Travel", "Education", "Debt Payment", "Charitable Giving", "Family Support", "Tax", "Insurance", "Subscriptions", "Personal Care", "Vehicle Maintenance", "Clothing", "Electronics", "Other"]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const getMLCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await mlService.getCategories();
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error(`Failed to fetch ML categories: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ML categories',
      details: error.message
    });
  }
});

module.exports = {
  predictCategory,
  getMLServiceHealth,
  getMLCategories
}; 