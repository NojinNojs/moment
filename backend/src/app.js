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
const categoryPredictionRoutes = require('./routes/categoryPredictionRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { swaggerUi, swaggerDocs, customCss } = require('./utils/swagger');
const assetRoutes = require('./routes/assetRoutes');
const csrf = require('csurf'); // Directly import csrf here
const restoreTransactionRoute = require('./routes/restoreTransactionRoute');
const userRoutes = require('./routes/userRoutes');

// Security middleware
const securityMiddleware = require('./middlewares/securityMiddleware');
const apiKeyMiddleware = require('./middlewares/apiKeyMiddleware');

// Load environment variables
loadEnv();

// Connect to database
connectDB();

// Get API prefix from environment variables
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';

// Create the full API base path
const API_BASE_PATH = `${API_PREFIX}/${API_VERSION}`;

// Set up trust proxy if configured (important for secure cookies behind a proxy/load balancer)
if (process.env.TRUST_PROXY === 'true') {
  const trustProxyValue = parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
  app.set('trust proxy', isNaN(trustProxyValue) ? 1 : trustProxyValue);
  console.log(chalk.green('✅ Trust Proxy:') + chalk.bold.green(' Enabled'));
} else {
  // For Heroku, we need to enable trust proxy
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    console.log(chalk.yellow('⚠️ Trust Proxy:') + chalk.bold.yellow(' Automatically enabled for production deployment'));
  }
}

// Apply common middleware
app.use(express.json({ limit: '10mb' })); // JSON body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Get allowed origins from environment variable with fallback
const corsOptionsOrigin = process.env.CORS_ORIGIN || '*';
// Parse comma-separated list of allowed origins
const allowedOrigins = corsOptionsOrigin === '*' ? '*' : corsOptionsOrigin.split(',').map(origin => origin.trim());
console.log(chalk.green('✅ CORS Origins:'), corsOptionsOrigin === '*' ? chalk.bold.green(' All Origins (*)') : chalk.bold.green(` ${allowedOrigins.join(', ')}`));

// CORS middleware to handle both trailing slash and non-trailing slash origins
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow all origins if wildcard is set
    if (allowedOrigins === '*' || allowedOrigins.includes('*')) return callback(null, true);
    
    // Allow all localhost origins for development and preview
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Allow all 127.0.0.1 origins for development and preview
    if (origin.match(/^https?:\/\/127\.0\.0\.1(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Allow all herokuapp.com domains
    if (origin.match(/^https?:\/\/.*\.herokuapp\.com$/)) {
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
app.use(securityMiddleware.rateLimiter);

// Cookie parser (needed for CSRF)
app.use(securityMiddleware.cookieParser);

// Apply CSRF protection if enabled
if (process.env.CSRF_PROTECTION === 'true') {
  console.log(chalk.green('✅ CSRF Protection:') + chalk.bold.green(' Enabled'));

  // Initialize a new CSRF protection instance with custom cookie settings for local development
  const csrfProtection = csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? null : 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined
    }
  });

  // Create a dedicated route for CSRF token that applies csrf protection first
  app.get(`${API_BASE_PATH}/auth/csrf-token`, (req, res, next) => {
    console.log('CSRF route accessed, applying csrfProtection...');
    try {
      csrfProtection(req, res, (err) => {
        if (err) {
          console.error('CSRF Protection Error:', err);
          return res.status(500).json({
            success: false,
            message: 'CSRF token generation failed',
            error: err.message
          });
        }
        
        console.log('CSRF Protection applied successfully');
        next();
      });
    } catch (error) {
      console.error('CSRF Error caught:', error);
      return res.status(500).json({
        success: false,
        message: 'CSRF token generation error',
        error: error.message
      });
    }
  }, (req, res) => {
    try {
      // Token function should now be available since we applied csrfProtection to this route
      const token = req.csrfToken();
      console.log('CSRF token generated successfully');
      res.json({
        success: true,
        message: 'CSRF token generated successfully',
        data: {
          csrfToken: token
        }
      });
    } catch (error) {
      console.error('CSRF Token Generation Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate CSRF token',
        error: error.message
      });
    }
  });

  // Apply CSRF protection to all routes except those that should be excluded
  app.use((req, res, next) => {
    // Skip CSRF for these paths or methods
    if (
      req.path.includes('/docs') ||
      req.path.includes('/health') ||
      req.path === `${API_BASE_PATH}/auth/csrf-token` ||
      req.method === 'GET' ||
      req.method === 'OPTIONS' ||
      (process.env.NODE_ENV === 'production' && req.path.includes('/auth'))
    ) {
      return next();
    }
    
    // Apply CSRF protection to all other routes
    csrfProtection(req, res, next);
  });

  // Add CSRF error handler
  app.use(securityMiddleware.csrfErrorHandler);
} else {
  console.log(chalk.yellow('⚠️ CSRF Protection:') + chalk.bold.yellow(' Disabled'));
  
  // Provide a dummy CSRF endpoint even when disabled
  app.get(`${API_BASE_PATH}/auth/csrf-token`, (req, res) => {
    return res.json({
      success: true,
      message: 'CSRF protection is disabled',
      data: {
        csrfToken: 'csrf-disabled'
      }
    });
  });
}

// Request logger middleware (for development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${chalk.blue(req.method)} ${chalk.green(req.originalUrl)}`);
    next();
  });
}

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Root redirect to API documentation
app.get('/', (req, res) => {
  res.redirect(`${API_PREFIX}/docs`);
});

// API documentation
app.use(`${API_PREFIX}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customCss,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    displayRequestDuration: true
  },
  customJs: [
    'https://unpkg.com/swagger-ui-dist@5.4.2/swagger-ui-bundle.js',
    'https://unpkg.com/swagger-ui-dist@5.4.2/swagger-ui-standalone-preset.js'
  ],
  customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.4.2/swagger-ui.css'
}));

// Legacy path support for API docs at versioned path
app.use(`${API_BASE_PATH}/docs`, (req, res) => {
  res.redirect(`${API_PREFIX}/docs`);
});

// Define a simple health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Define routes
app.use(`${API_BASE_PATH}/auth`, authRoutes);
app.use(`${API_BASE_PATH}/transactions`, apiKeyMiddleware.validateApiKey, transactionRoutes);
app.use(`${API_BASE_PATH}/categories`, apiKeyMiddleware.validateApiKey, categoryRoutes);
app.use(`${API_BASE_PATH}/assets`, apiKeyMiddleware.validateApiKey, assetRoutes);
app.use(`${API_BASE_PATH}/transactions`, apiKeyMiddleware.validateApiKey, restoreTransactionRoute);
app.use(`${API_BASE_PATH}/users`, userRoutes);
app.use(`${API_BASE_PATH}/categories`, apiKeyMiddleware.validateApiKey, categoryPredictionRoutes);

// Error handling middleware
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);

// Export the app
module.exports = app; 