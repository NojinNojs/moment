# 🚀 Moment API - RESTful Backend

A modern RESTful API built with Express.js, MongoDB, and JWT authentication, designed to follow RESTful API best practices with comprehensive documentation.

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Running the API](#running-the-api)
  - [ML Service Setup](#ml-service-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
  - [API Endpoints](#api-endpoints)
  - [Response Format](#response-format)
- [Core Functionality](#core-functionality)
  - [Authentication System](#authentication-system)
  - [Transaction Management](#transaction-management)
  - [Asset Management](#asset-management)
  - [Categories System](#categories-system)
  - [ML Integration](#ml-integration)
- [Database Models](#database-models)
- [Error Handling](#error-handling)
- [Security Measures](#security-measures)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🔍 Overview

The Moment API is the backend service for the Moment personal finance application. It provides a secure, scalable REST API that handles user authentication, data storage, and business logic for financial management features. The API follows RESTful principles and includes comprehensive validation, error handling, and documentation.

## ✨ Key Features

- **RESTful API Design**: Follows REST architectural principles for consistent interface
- **Express.js Framework**: Fast, unopinionated backend framework
- **MongoDB Database**: Flexible NoSQL database using Mongoose ODM
- **JWT Authentication**: Secure authentication with JSON Web Tokens
- **API Versioning**: Support for multiple API versions via URL prefixes
- **Input Validation**: Request validation with express-validator
- **Swagger Documentation**: Interactive OpenAPI/Swagger documentation
- **Error Handling**: Standardized error responses with proper HTTP codes
- **Security Features**: CORS, rate limiting, secure headers, and more
- **Logging**: Comprehensive logging with Winston
- **Environment Configuration**: Separate development/production/testing environments
- **Category Management**: Pre-built system for transaction categorization
- **ML Integration**: Automatic transaction categorization via ML service

## 🚀 Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm (v7.x or higher)
- MongoDB (v4.4 or higher) - local installation or cloud-based (MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NojinNojs/moment.git
   cd moment/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run setup-env
   ```
   This script guides you through setting up your environment variables, including:
   - Server configuration
   - Database connection
   - Authentication settings
   - API options

   Alternatively, you can manually copy and edit the example file:
   ```bash
   cp .env.example .env
   # Then edit .env with your preferred settings
   ```

### Database Setup

1. **Connect to MongoDB**
   
   The API supports two methods for MongoDB connection:
   
   **Local MongoDB**:
   - Install MongoDB on your local machine
   - Start the MongoDB service
   - Set your connection string to `mongodb://localhost:27017/momentdb`
   
   **MongoDB Atlas**:
   - Create a MongoDB Atlas account
   - Set up a cluster
   - Get your connection string and add it to your .env file
   - Make sure to whitelist your IP address in Atlas

2. **Initialize Default Data**
   
   To seed the database with initial categories and settings:
   ```bash
   npm run seed:categories
   ```

### ML Service Setup

1. **Configure ML Service Integration**

   Add the following configuration to your `.env` file for ML service integration:

   ```
   # ML Service Configuration
   ML_SERVICE_URL=http://localhost:8000     # URL of the ML service
   ML_REQUEST_TIMEOUT=5000                  # Request timeout in milliseconds
   ENABLE_ML_CACHE=true                     # Enable prediction caching
   ML_CONFIDENCE_THRESHOLD=0.7              # Minimum confidence threshold
   ML_LOGGING=true                          # Enable dedicated ML logs
   ```

2. **Ensure ML Service is Running**

   Make sure the ML service is running and accessible at the configured URL before using auto-categorization features.

   See the [ML Service README](/machine-learning/README.md) for setup instructions.

3. **Test ML Integration**

   After setting up both services, test the integration with:

   ```bash
   # Test ML service health
   curl http://localhost:3000/api/v1/categories/predict/health

   # Test prediction capability
   curl -X POST http://localhost:3000/api/v1/categories/predict \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"text": "Grocery shopping at Walmart", "type": "expense"}'
   ```

### Running the API

1. **Start the development server**
   ```bash
   npm run dev
   ```
   The API will be available at http://localhost:3000/api/v1

2. **Access the documentation**

   When the server is running, access the interactive API documentation at:
   ```
   http://localhost:3000/api/docs
   ```

3. **Testing with Postman**
   
   We provide a Postman collection for testing:
   - Import the collection from `scripts/postman/moment-api.postman_collection.json`
   - Set up a Postman environment with `baseUrl` variable

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # Database connection
│   │   ├── env.js           # Environment variable handling
│   │   └── logger.js        # Logging configuration
│   │
│   ├── controllers/         # Request handlers
│   │   ├── authController.js       # Authentication endpoints
│   │   ├── transactionController.js # Transaction endpoints
│   │   ├── assetController.js      # Asset endpoints
│   │   ├── categoryController.js   # Category endpoints
│   │   └── ...
│   │
│   ├── middlewares/         # Custom middleware
│   │   ├── authMiddleware.js        # Authentication middleware
│   │   ├── errorMiddleware.js       # Error handling middleware
│   │   ├── validationMiddleware.js  # Request validation
│   │   └── ...
│   │
│   ├── models/              # Mongoose data models
│   │   ├── User.js          # User model
│   │   ├── Transaction.js   # Transaction model
│   │   ├── Asset.js         # Asset model
│   │   ├── Category.js      # Category model
│   │   └── ...
│   │
│   ├── routes/              # API routes
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── transactionRoutes.js # Transaction routes
│   │   ├── assetRoutes.js       # Asset routes
│   │   ├── categoryRoutes.js    # Category routes
│   │   └── ...
│   │
│   ├── services/            # Business logic
│   │   ├── authService.js        # Authentication logic
│   │   ├── transactionService.js # Transaction logic
│   │   └── ...
│   │
│   ├── ml/                  # ML integration
│   │   ├── mlService.js     # ML service client
│   │   └── ...
│   │
│   ├── utils/               # Helper functions
│   │   ├── apiResponse.js   # Standardized response formatter
│   │   ├── dateUtils.js     # Date/time utilities
│   │   ├── logger.js        # Logging utilities
│   │   └── ...
│   │
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point
│
├── scripts/                 # Utility scripts
│   ├── setup-env.js         # Environment setup script
│   ├── seed-categories.js   # Database seeding script
│   └── ...
│
├── tests/                   # Test files
│   ├── integration/         # Integration tests
│   ├── unit/                # Unit tests
│   └── ...
│
├── .env.example             # Example environment variables
├── .env.development         # Development environment variables
├── .env.production          # Production environment variables
└── ...                      # Configuration files
```

## 📚 API Documentation

Interactive API documentation is available at `/api/docs` when the server is running.

### Base URL

```
http://localhost:3000/api/v1
```

For production:
```
https://api.moment-finance.com/api/v1
```

### Authentication

Authentication is handled using JWT tokens:

1. Register a new user or login with existing credentials
2. Include the returned token in the `Authorization` header for protected routes:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

### API Endpoints

#### Auth Routes

| Method | Endpoint        | Description                | Access      |
|--------|-----------------|----------------------------|-------------|
| POST   | /auth/register  | Register a new user        | Public      |
| POST   | /auth/login     | Authenticate user          | Public      |
| GET    | /auth/me        | Get current user profile   | Protected   |
| POST   | /auth/logout    | Logout user                | Protected   |

#### Transaction Routes

| Method | Endpoint                     | Description                   | Access      |
|--------|------------------------------|-------------------------------|-------------|
| GET    | /transactions                | Get all user transactions     | Protected   |
| POST   | /transactions                | Create a new transaction      | Protected   |
| GET    | /transactions/:id            | Get transaction by ID         | Protected   |
| PUT    | /transactions/:id            | Update transaction            | Protected   |
| DELETE | /transactions/:id            | Soft delete transaction       | Protected   |
| DELETE | /transactions/:id/permanent  | Permanently delete transaction| Protected   |
| PUT    | /transactions/:id/restore    | Restore deleted transaction   | Protected   |

#### Asset Routes

| Method | Endpoint                   | Description                | Access      |
|--------|----------------------------|----------------------------|-------------|
| GET    | /assets                    | Get all user assets        | Protected   |
| POST   | /assets                    | Create a new asset         | Protected   |
| GET    | /assets/:id                | Get asset by ID            | Protected   |
| PUT    | /assets/:id                | Update asset               | Protected   |
| DELETE | /assets/:id                | Delete asset               | Protected   |
| POST   | /assets/transfer           | Transfer between assets    | Protected   |
| GET    | /assets/transfers          | Get asset transfer history | Protected   |

#### Category Routes

| Method | Endpoint                  | Description                | Access      |
|--------|---------------------------|----------------------------|-------------|
| GET    | /categories               | Get all categories         | Protected   |
| POST   | /categories               | Create a new category      | Protected   |
| GET    | /categories/:id           | Get category by ID         | Protected   |
| PUT    | /categories/:id           | Update category            | Protected   |
| DELETE | /categories/:id           | Delete category            | Protected   |

#### ML Integration Routes

| Method | Endpoint                       | Description                    | Access      |
|--------|--------------------------------|--------------------------------|-------------|
| POST   | /categories/predict            | Predict transaction category   | Protected   |
| GET    | /categories/predict/health     | Check ML service health        | Admin       |
| GET    | /categories/ml-categories      | Get ML service categories      | Protected   |

### Response Format

All API responses follow a standard format:

#### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }  // For paginated results
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }  // Validation errors, if any
}
```

## 💻 Core Functionality

### Authentication System

User authentication is implemented using JWT (JSON Web Tokens):

- **Registration**: User provides name, email, and password
- **Login**: User provides email and password, receives JWT token
- **Token Validation**: Middleware validates JWT token for protected routes
- **Token Expiration**: Tokens expire after the configured time (default: 30 days)

Security measures include:
- Password hashing with bcrypt
- JWT secret key for signing tokens
- Token expiration
- HTTP-only cookies option for production

Implementation details:
- JWT tokens are created in the authController
- Token validation is handled by the authMiddleware
- All protected routes use the 'protect' middleware

### Transaction Management

Transactions form the core of the financial management system:

- **Types**: Transactions can be income or expense
- **Properties**: Include amount, category, date, description, etc.
- **Soft Delete**: Transactions are marked as deleted but not removed
- **Permanent Delete**: Option to permanently remove transactions
- **Restore**: Deleted transactions can be restored

Implementation:
- Transactions belong to a specific user
- Multiple filtering options (date range, category, type)
- Pagination support for transaction listing
- Sorting by various fields

### Asset Management

Assets represent financial accounts:

- **Types**: Cash, bank account, credit card, investment, etc.
- **Balance**: Each asset maintains a current balance
- **Transfers**: Assets support transfers between accounts
- **History**: Maintains transaction history for each asset

Implementation:
- Balance is updated automatically on transactions
- Transfer operations create corresponding transactions
- Validation ensures sufficient funds for transfers

### Categories System

Categories organize transactions for better insights:

- **Types**: Income and expense categories
- **Presets**: System comes with predefined categories
- **Customization**: Users can create custom categories
- **Color Coding**: Categories can have associated colors

Implementation:
- Categories are shared across users but belong to a system
- Seeding script creates default categories
- Categories can be customized with colors and icons

### ML Integration

The API integrates with a machine learning service to provide automatic transaction categorization:

#### Features

- **Automatic Categorization**: Transactions can be automatically categorized based on their title and description
- **Confidence Scoring**: Each prediction includes a confidence score to assess reliability
- **Fallback Mechanism**: Default categories are used when predictions have low confidence
- **Caching System**: Efficient caching of predictions to reduce latency and service load
- **Alternative Suggestions**: Multiple category suggestions with confidence scores

#### Implementation

- **Client-Service Architecture**: Backend connects to a separate ML service via HTTP
- **Prediction Endpoint**: `/api/categories/predict` for direct prediction requests
- **Auto Mode**: Transactions can opt-in to auto-categorization during creation
- **Health Checking**: ML service health status monitoring
- **Error Handling**: Graceful degradation with fallback categories when service unavailable

#### Usage in Transaction Creation

When creating a transaction with auto-categorization:

```json
// Request
POST /api/transactions
{
  "title": "Indomaret Kemang",
  "amount": 120000,
  "type": "expense",
  "description": "Weekly groceries",
  "useAutoCategory": true
}

// Response
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "title": "Indomaret Kemang",
    "amount": 120000,
    "type": "expense",
    "description": "Weekly groceries",
    "category": "Food & Dining",
    "categoryConfidence": 0.92,
    "isAutoCategorizationApplied": true,
    "_id": "60f7e5c67d123e001fc12345",
    "date": "2023-07-21T08:15:42.123Z",
    "user": "60f7e5c67d123e001fc12346"
  }
}
```

#### Direct Category Prediction

You can also directly predict a category without creating a transaction:

```json
// Request
POST /api/categories/predict
{
  "text": "Gojek ride to office",
  "type": "expense"
}

// Response
{
  "success": true,
  "message": "Category prediction successful",
  "data": {
    "prediction": {
      "category": "Transportation",
      "confidence": 0.88
    },
    "alternative_categories": [
      { "category": "Travel", "confidence": 0.09 },
      { "category": "Other", "confidence": 0.03 }
    ],
    "processed_text": "gojek ride office",
    "metadata": {
      "source": "ml_service",
      "request_id": "pred_20230721_081542",
      "is_fallback": false
    }
  }
}
```

## 🗃️ Database Models

### User Model

```javascript
{
  name: String,       // User's full name
  email: String,      // Unique email address
  password: String,   // Hashed password
  createdAt: Date,    // Account creation date
  updatedAt: Date     // Last update date
}
```

### Transaction Model

```javascript
{
  amount: Number,     // Transaction amount
  type: String,       // 'income' or 'expense'
  category: String,   // Category ID or name
  title: String,      // Short title
  description: String,// Optional description
  date: Date,         // Transaction date
  account: ObjectId,  // Reference to Asset model
  isDeleted: Boolean, // Soft delete flag
  user: ObjectId,     // Reference to User model
  categoryConfidence: Number, // Confidence score if ML-categorized
  isAutoCategorizationApplied: Boolean, // Whether ML was used
  autoCategorizationReason: String // Why a fallback was used, if any
}
```

### Asset Model

```javascript
{
  name: String,       // Asset name
  type: String,       // Asset type (cash, bank, etc.)
  balance: Number,    // Current balance
  initialBalance: Number, // Starting balance
  description: String,// Optional description
  isDeleted: Boolean, // Soft delete flag
  user: ObjectId      // Reference to User model
}
```

### Category Model

```javascript
{
  name: String,       // Category name
  type: String,       // 'income' or 'expense'
  color: String,      // Color code (hex)
  icon: String,       // Icon identifier
  isDefault: Boolean, // Whether it's a system default
  user: ObjectId      // Reference to User model (null for defaults)
}
```

## ⚠️ Error Handling

The API uses standard HTTP status codes and a consistent error response format:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request format or parameters
- `401 Unauthorized`: Authentication failed or token missing
- `403 Forbidden`: Authenticated but not authorized for the action
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Server Error`: Something went wrong on the server

Error handling implementation:
- Centralized error middleware
- Standardized error response format
- Detailed validation error messages
- Production vs. development error details
- Error logging with Winston logger

## 🔒 Security Measures

The API implements several security best practices:

- **CORS**: Configurable Cross-Origin Resource Sharing
- **Helmet**: HTTP security headers
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Validate all user inputs
- **Password Security**: Bcrypt hashing with appropriate salt rounds
- **XSS Protection**: Sanitize inputs to prevent cross-site scripting
- **CSRF Protection**: Cross-site request forgery prevention
- **MongoDB Injection Prevention**: Sanitize database queries
- **Sensitive Data Exposure**: Hide sensitive data in responses

### CSRF Protection

The API implements Cross-Site Request Forgery (CSRF) protection to prevent unauthorized actions from being performed on behalf of authenticated users.

#### How CSRF Protection Works

1. **Cookie-based Tokens**: Our implementation uses the `csurf` package to generate and validate CSRF tokens. This is a double-submit cookie pattern that provides robust protection.

2. **Token Generation**: When a client first connects or specifically requests a CSRF token:
   - The server generates a unique token
   - The token is stored in an HTTP-only, secure cookie
   - The token is also sent in the response body or headers

3. **Token Validation**: For all state-changing requests (POST, PUT, DELETE, etc.):
   - The client must include the token in the `X-CSRF-Token` header
   - The server validates this token against the cookie
   - If invalid, the request is rejected with a 403 error

#### CSRF Protection Endpoints

- `GET /api/v1/auth/csrf-token`: Get a fresh CSRF token

#### Implementation in Frontend

The frontend automatically:
1. Fetches a CSRF token on application load
2. Sends the token with each modification request
3. Refreshes the token if it becomes invalid

#### Configuration

CSRF protection can be enabled/disabled via the `CSRF_PROTECTION` environment variable:

```
# Enable CSRF protection
CSRF_PROTECTION=true

# Disable CSRF protection (not recommended for production)
CSRF_PROTECTION=false
```

#### Troubleshooting

If you encounter CSRF validation errors:

1. Ensure your frontend is sending the `X-CSRF-Token` header with non-GET requests
2. Verify your backend has CSRF protection enabled
3. Check that cookies are properly being set (requires `credentials: 'include'` in fetch/axios)
4. Ensure you're using the `/auth/csrf-token` endpoint to get a fresh token

## 🧪 Testing

We use Jest and Supertest for testing:

```bash
# Run all tests
npm run test

# Run specific test suite
npm run test:auth
npm run test:transactions

# Run tests with coverage
npm run test:coverage
```

Test organization:
- Unit tests for individual functions
- Integration tests for API endpoints
- Test database setup and teardown

## 🚢 Deployment

### Deployment Options

1. **Docker Deployment**
   ```bash
   # Build Docker image
   docker build -t moment-api .
   
   # Run container
   docker run -p 3000:3000 moment-api
   ```

2. **Standard Node.js Deployment**
   ```bash
   # Build for production
   npm run build
   
   # Start production server
   npm start
   ```

3. **Cloud Deployment**
   
   The API can be deployed to any Node.js hosting service like:
   - AWS Elastic Beanstalk
   - Google Cloud Run
   - Heroku
   - Digital Ocean

### Production Considerations

- Set up a production MongoDB instance (MongoDB Atlas recommended)
- Configure environment variables for production
- Set up proper logging
- Implement monitoring with tools like Prometheus or Datadog
- Set up CI/CD pipeline for automated deployments

## ❓ Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check MongoDB connection string
   - Verify network connectivity
   - Check database user permissions
   - Make sure IP is whitelisted if using Atlas

2. **Authentication Issues**
   - Check JWT secret in environment variables
   - Verify token expiration settings
   - Check for clock drift between systems

3. **Validation Errors**
   - Check API documentation for required fields
   - Ensure data types match expected formats
   - Verify that fields meet length/format requirements

4. **Server Startup Problems**
   - Check for port conflicts
   - Verify all environment variables are set
   - Check log files for detailed errors

5. **ML Integration Issues**
   - Verify ML service is running and accessible
   - Check ML_SERVICE_URL environment variable
   - Examine ML-specific logs in logs/ml-service.log
   - Test ML service health endpoint
   - Verify if fallback categories work correctly

## 👥 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow coding standards and conventions
4. Write tests for your changes
5. Submit a pull request with a clear description

### Development Guidelines

- Use consistent code formatting
- Add appropriate comments and documentation
- Write unit and integration tests
- Follow existing patterns for controllers and routes
- Update API documentation for any changes
