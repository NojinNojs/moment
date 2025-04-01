// This file sets up the Express application, including middleware and routes.
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const chalk = require('chalk');
const connectDB = require('./config/db');
const loadEnv = require('./config/dotenv');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { swaggerUi, swaggerDocs, customCss } = require('./utils/swagger');
const assetRoutes = require('./routes/assetRoutes');

// Security middleware
const securityMiddleware = require('./middlewares/securityMiddleware');
const apiKeyMiddleware = require('./middlewares/apiKeyMiddleware');

// Load environment variables
loadEnv();

// Connect to the database
// This has been removed to prevent duplicate connection, as it's already in server.js
// connectDB();

// Auto seed categories if enabled in environment settings
if (process.env.AUTO_SEED_CATEGORIES === 'true') {
  try {
    // We'll only log this once to avoid duplicate logs
    console.log(chalk.yellow('📊 Auto-seeding categories is enabled. Running category seeder...'));
    
    // Import the seeder but don't run it immediately
    const seedCategories = require('./seeders/categorySeeders');
    
    // We'll run the seeder after the database connection is established
    // This will be handled in server.js to avoid duplicate connections
    // and prevent parallel seeding attempts
    global.runCategorySeedersAfterConnection = true;
    
  } catch (error) {
    console.error(chalk.red(`❌ Error initializing category seeder: ${error.message}`));
    // Don't crash the app if seeding fails
  }
}

// CORS Configuration
const corsOptionsOrigin = process.env.CORS_ORIGIN || '*';

// Parse comma-separated origins into an array
const allowedOrigins = corsOptionsOrigin === '*' 
  ? '*' 
  : corsOptionsOrigin.split(',').map(origin => origin.trim());

// CORS middleware to handle both trailing slash and non-trailing slash origins
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow all origins if wildcard is set
    if (allowedOrigins === '*') return callback(null, true);
    
    // Allow all localhost origins for development and preview
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Allow all 127.0.0.1 origins for development and preview
    if (origin.match(/^https?:\/\/127\.0\.0\.1(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Clean up request origin for comparison (remove trailing slashes)
    const requestOrigin = origin.replace(/\/$/, '');
    
    // Check if the origin matches any in our allowed list
    const originIsAllowed = allowedOrigins.some(allowedOrigin => {
      // Clean up each allowed origin for comparison
      const cleanAllowedOrigin = allowedOrigin.replace(/\/$/, '');
      return cleanAllowedOrigin === requestOrigin;
    });
    
    if (originIsAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${origin} not allowed by ${corsOptionsOrigin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-API-Key', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Range', 'X-Total-Count', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Apply security middleware
app.use(cors(corsOptions));
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.rateLimiter); // Global rate limiter
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Cookie parser (needed for CSRF)
app.use(securityMiddleware.cookieParser);

// Apply CSRF protection if enabled
if (process.env.CSRF_PROTECTION === 'true') {
  console.log(chalk.green('✅ CSRF Protection:') + chalk.bold.green(' Enabled'));
  
  // Skip CSRF for API docs and specific paths
  app.use((req, res, next) => {
    if (req.path.includes('/docs') || 
        req.path.includes('/health') || 
        req.method === 'GET') {
      next();
    } else {
      securityMiddleware.csrf(req, res, next);
    }
  });
  
  app.use(securityMiddleware.csrfErrorHandler);
  app.use(securityMiddleware.csrfTokenProvider);
} else {
  console.log(chalk.yellow('⚠️ CSRF Protection:') + chalk.bold.yellow(' Disabled'));
}

// Request logger middleware (for development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${chalk.blue(req.method)} ${chalk.green(req.originalUrl)}`);
    next();
  });
}

// Static files
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// API version prefix
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';
const API_PATH = `${API_PREFIX}/${API_VERSION}`;

// Serve Swagger documentation
app.use(`${API_PREFIX}/docs`, swaggerUi.serve);
app.get(`${API_PREFIX}/docs`, swaggerUi.setup(swaggerDocs, { 
  customCss,
  customSiteTitle: "Moment API Documentation",
  customfavIcon: '/favicon.ico'
}));

// API Health Check
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Apply stricter rate limits to auth routes
app.use(`${API_PATH}/auth`, securityMiddleware.authLimiter);

// Apply API Key validation to protected routes
// Skip API Key validation for auth routes
app.use(`${API_PATH}/transactions`, apiKeyMiddleware);

// API Routes with versioning
app.use(`${API_PATH}/auth`, authRoutes);
app.use(`${API_PATH}/transactions`, transactionRoutes);
app.use(`${API_PATH}/categories`, categoryRoutes);
app.use(`${API_PATH}/assets`, assetRoutes);

// Redirect legacy API routes (without version) to versioned routes
app.use(`${API_PREFIX}/auth`, (req, res) => res.redirect(307, `${API_PATH}/auth${req.path}`));
app.use(`${API_PREFIX}/transactions`, (req, res) => res.redirect(307, `${API_PATH}/transactions${req.path}`));
app.use(`${API_PREFIX}/categories`, (req, res) => res.redirect(307, `${API_PATH}/categories${req.path}`));

// Redirect unknown routes to API docs
app.use(API_PREFIX, (req, res, next) => {
  // Skip redirect for API endpoints we know
  if (req.path.startsWith(`/${API_VERSION}/`) || 
      req.path.startsWith('/docs') || 
      req.path.startsWith('/health')) {
    return next();
  }
  
  // Redirect to docs for other API routes
  res.redirect(`${API_PREFIX}/docs`);
});

// Catch-all route for non-API routes
app.get('*', (req, res) => {
  res.redirect(`${API_PREFIX}/docs`);
});

// Error handling middleware
app.use(errorMiddleware);

module.exports = app; 