// This file sets up the Express application, including middleware and routes.
const express = require('express');
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

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Serve Swagger documentation
app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerDocs, { 
  customCss,
  customSiteTitle: "Moment API Documentation",
  customfavIcon: '/favicon.ico'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Redirect unknown routes to API docs
app.use('/api', (req, res, next) => {
  // Skip redirect for API endpoints we know
  if (req.path.startsWith('/auth') || 
      req.path.startsWith('/transactions') || 
      req.path.startsWith('/docs')) {
    return next();
  }
  
  // Redirect to docs for other API routes
  res.redirect('/api/docs');
});

// Catch-all route for non-API routes
app.get('*', (req, res) => {
  res.redirect('/api/docs');
});

// Error handling middleware
app.use(errorMiddleware);

module.exports = app; 