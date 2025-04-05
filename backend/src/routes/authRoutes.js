// This file defines the routes for user registration and login.
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const authValidation = require('../validators/authValidation');
const securityMiddleware = require('../middlewares/securityMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSettings:
 *       type: object
 *       properties:
 *         currency:
 *           type: string
 *           example: USD
 *         language:
 *           type: string
 *           example: en
 *         colorMode:
 *           type: string
 *           enum: [light, dark]
 *           example: light
 *         notifications:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with name, email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: User's password (min 8 characters)
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: User registered successfully
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 60d5f8b8b98d7e2b5c9c2c0b
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                         settings:
 *                           $ref: '#/components/schemas/UserSettings'
 *                         token:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/register',
  authValidation.registerValidation,
  validate,
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user & get token
 *     description: Logs in a user with email and password credentials
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: Login successful
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 60d5f8b8b98d7e2b5c9c2c0b
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                         settings:
 *                           $ref: '#/components/schemas/UserSettings'
 *                         token:
 *                           type: string
 *                           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/login',
  authValidation.loginValidation,
  validate,
  authController.login
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user's profile information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: User profile retrieved successfully
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 60d5f8b8b98d7e2b5c9c2c0b
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                         settings:
 *                           $ref: '#/components/schemas/UserSettings'
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-03-15T12:00:00Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-03-15T12:00:00Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/me', protect, authController.getCurrentUser);

/**
 * @swagger
 * /auth/settings:
 *   get:
 *     summary: Get user settings
 *     description: Retrieves the authenticated user's settings
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: User settings retrieved successfully
 *                     data:
 *                       $ref: '#/components/schemas/UserSettings'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/settings', protect, authController.getUserSettings);

/**
 * @swagger
 * /auth/settings:
 *   put:
 *     summary: Update user settings
 *     description: Updates the authenticated user's settings
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 example: IDR
 *               language:
 *                 type: string
 *                 example: id
 *               colorMode:
 *                 type: string
 *                 enum: [light, dark]
 *                 example: dark
 *               notifications:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: User settings updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: User settings updated successfully
 *                     data:
 *                       $ref: '#/components/schemas/UserSettings'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/settings', protect, authController.updateUserSettings);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       example: Logged out successfully
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout', authController.logout);

// CSRF token endpoint is handled in app.js

module.exports = router; 