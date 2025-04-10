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
 *                     processed_text:
 *                       type: string
 *                       example: grocery shopping walmart
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         source:
 *                           type: string
 *                           example: ml_service
 *                         request_id:
 *                           type: string
 *                           example: pred_20230721_081542
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
        confidence: predictionResult.primary_category.confidence,
        processed_text: predictionResult.processed_text,
        metadata: {
          source: predictionResult.source,
          request_id: predictionResult.request_id,
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
 * /categories/predict/health:
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const getMLServiceHealth = asyncHandler(async (req, res) => {
  try {
    const isHealthy = await mlService.checkHealth();
    
    res.status(200).json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
      }
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
 * /categories/ml-categories:
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
 *                       example: ["Salary", "Freelance", "Investment"]
 *                     expense:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Food & Dining", "Transportation", "Housing"]
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
    res.status(500);
    throw new Error('Failed to fetch categories from ML service');
  }
});

module.exports = {
  predictCategory,
  getMLServiceHealth,
  getMLCategories
}; 