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
│   ├── utils/               # Helper functions
│   │   ├── apiResponse.js   # Standardized response formatter
│   │   ├── dateUtils.js     # Date/time utilities
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
  user: ObjectId      // Reference to User model
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

For more detailed information, see the main [CONTRIBUTING.md](../CONTRIBUTING.md) file. 