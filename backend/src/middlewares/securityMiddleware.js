/**
 * Security Middleware Collection
 * 
 * This file gathers various security middlewares to protect the API
 * including rate limiting, helmet protection, CSRF protection, etc.
 */
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const chalk = require('chalk');

// Initialize security middleware collection
const securityMiddleware = {};

// Rate limiting middleware - limit requests by IP address
securityMiddleware.rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  skip: (req) => {
    // Skip rate limiting for trusted sources like local development
    return process.env.NODE_ENV === 'development' && req.ip === '::1';
  },
  // Log when rate limit is hit (instead of using onLimitReached)
  handler: (req, res, options, next) => {
    console.warn(chalk.yellow(`Rate limit exceeded for IP: ${req.ip}`));
    res.status(options.statusCode).send(options.message);
  }
});

// API route rate limiter - stricter limits for specific API endpoints
securityMiddleware.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  message: {
    success: false,
    message: 'Too many requests to this API endpoint, please try again later.',
  }
});

// Authentication route rate limiter - even stricter for auth endpoints
securityMiddleware.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  // Log when auth rate limit is hit (instead of using onLimitReached)
  handler: (req, res, options, next) => {
    console.warn(chalk.yellow.bold(`⚠️ Multiple authentication attempts detected from IP: ${req.ip}`));
    res.status(options.statusCode).send(options.message);
  }
});

// Helmet middleware for securing HTTP headers
securityMiddleware.helmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
    },
  },
  // Other helmet options
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true,
});

// Cookie parser middleware (required for CSRF protection)
securityMiddleware.cookieParser = cookieParser();

// CSRF protection middleware - initialize once and export
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/'
  } 
});

// Export the CSRF middleware
securityMiddleware.csrf = csrfProtection;

// CSRF error handler
securityMiddleware.csrfErrorHandler = (err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  console.warn(chalk.yellow.bold(`⚠️ CSRF attack detected from IP: ${req.ip}`));
  
  // Handle CSRF token errors
  res.status(403).json({
    success: false,
    message: 'Invalid or missing CSRF token'
  });
};

// CSRF token provider middleware - simplified approach
securityMiddleware.csrfTokenProvider = (req, res, next) => {
  // This middleware assumes it's used on a route where csrfProtection has already been applied
  if (typeof req.csrfToken === 'function') {
    res.json({
      success: true,
      message: 'CSRF token generated successfully',
      data: {
        csrfToken: req.csrfToken()
      }
    });
  } else {
    res.json({
      success: false,
      message: 'CSRF token generation failed - not properly configured',
      data: {
        csrfToken: null
      }
    });
  }
};

module.exports = securityMiddleware; 