# 🚀 Moment API - RESTful Backend

A modern RESTful API built with Express.js, MongoDB, and JWT authentication, designed to follow RESTful API best practices with comprehensive documentation.

## 📑 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [API Documentation](#api-documentation)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
  - [API Endpoints](#api-endpoints)
  - [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Consuming the API](#consuming-the-api)
- [License](#license)

## ✨ Features

- **RESTful API Design**: Follows global standards for API design
- **Express.js Server**: Fast, unopinionated backend framework
- **MongoDB Database**: Flexible NoSQL database using Mongoose ODM
- **JWT Authentication**: Secure authentication with JSON Web Tokens
- **API Versioning**: Support for multiple API versions
- **Input Validation**: Request validation with express-validator
- **Documentation**: Interactive OpenAPI/Swagger documentation
- **Error Handling**: Standardized error responses
- **CORS Support**: Cross-Origin Resource Sharing enabled
- **Environment Configuration**: Separate development/production environments

## 📂 Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration (DB, env variables)
│   ├── controllers/    # Route handlers (business logic)
│   ├── middlewares/    # Custom middleware (auth, validation)
│   ├── models/         # Mongoose data models
│   ├── routes/         # API routes
│   ├── services/       # External services integration
│   ├── utils/          # Helper functions
│   ├── public/         # Public assets for documentation
│   ├── app.js          # Express app setup
│   └── server.js       # Server entry point
├── scripts/
│   └── setup-env.js    # Environment setup automation
├── .env.development    # Development environment variables
├── .env.production     # Production environment variables
├── .env.example        # Template for environment variables
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local instance or MongoDB Atlas account)

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

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the API documentation**
   ```
   http://localhost:3000/api/docs
   ```

### Environment Setup

We provide automated environment setup scripts to simplify configuration:

```bash
# Set up environment variables interactively
npm run setup-env

# Or set up a specific environment directly
npm run setup-dev   # Development environment
npm run setup-prod  # Production environment
```

#### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port number | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/momentdb` |
| `JWT_SECRET` | Secret key for JWT tokens | Auto-generated |
| `JWT_EXPIRE` | JWT token expiration time | `30d` (30 days) |
| `CORS_ORIGIN` | Allowed origins for CORS | `http://localhost:5173` |
| `LOG_LEVEL` | Logging level | `debug` |
| `API_PREFIX` | API route prefix | `/api` |
| `API_VERSION` | API version | `v1` |

## 📚 API Documentation

Interactive API documentation is available at `/api/docs` when the server is running.

### Base URL

```
http://localhost:3000/api/v1
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

#### Transaction Routes

| Method | Endpoint               | Description                   | Access      |
|--------|------------------------|-------------------------------|-------------|
| GET    | /transactions          | Get all user transactions     | Protected   |
| POST   | /transactions          | Create a new transaction      | Protected   |
| GET    | /transactions/:id      | Get transaction by ID         | Protected   |
| PUT    | /transactions/:id      | Update transaction            | Protected   |
| DELETE | /transactions/:id      | Delete transaction            | Protected   |

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

## ⚠️ Error Handling

The API uses standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request format or parameters
- `401 Unauthorized`: Authentication failed or token missing
- `403 Forbidden`: Authenticated but not authorized for the action
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Server Error`: Something went wrong on the server

## 🔄 Consuming the API

### Using Fetch API (JavaScript)

```javascript
// Example: Login with Fetch API
const loginUser = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    // Store token for future requests
    localStorage.setItem('token', data.data.token);
    
    return data.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Example: Get user profile with Fetch API (protected route)
const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch('http://localhost:3000/api/v1/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};
```

### Using Axios (JavaScript)

```javascript
// Example: Login with Axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to standardize error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

// Add auth token to requests when available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication functions
const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },
};

// Transaction functions
const transactionService = {
  // Get all transactions with optional filters
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response;
  },
  
  // Create a new transaction
  createTransaction: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response;
  },
  
  // Get a single transaction by ID
  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response;
  },
  
  // Update a transaction
  updateTransaction: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response;
  },
  
  // Delete a transaction
  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response;
  },
};

export { authService, transactionService };
```

## 📄 License

MIT 