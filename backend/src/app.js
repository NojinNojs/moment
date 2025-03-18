// This file sets up the Express application, including middleware and routes.
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const connectDB = require('./config/db');
const loadEnv = require('./config/dotenv');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { swaggerUi, swaggerDocs, customCss } = require('./utils/swagger');

// Load environment variables
loadEnv();

// Connect to the database
connectDB();

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Request logger middleware (for development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// API version prefix
const API_PREFIX = '/api';
const API_VERSION = '/v1';
const API_PATH = `${API_PREFIX}${API_VERSION}`;

// Serve Swagger documentation
app.use(`${API_PREFIX}/docs`, swaggerUi.serve);
app.get(`${API_PREFIX}/docs`, swaggerUi.setup(swaggerDocs, { 
  customCss,
  customSiteTitle: "Moment API Documentation",
  customfavIcon: '/favicon.ico'
}));

// API Routes with versioning
app.use(`${API_PATH}/auth`, authRoutes);
app.use(`${API_PATH}/transactions`, transactionRoutes);

// API Health Check
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Redirect legacy API routes (without version) to versioned routes
app.use('/api/auth', (req, res) => res.redirect(307, `${API_PATH}/auth${req.path}`));
app.use('/api/transactions', (req, res) => res.redirect(307, `${API_PATH}/transactions${req.path}`));

// Redirect unknown routes to API docs
app.use(API_PREFIX, (req, res, next) => {
  // Skip redirect for API endpoints we know
  if (req.path.startsWith('/v1/') || 
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