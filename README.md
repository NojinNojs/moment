# Moment (Money Management)

A web-based money management application that simplifies personal finance management with the help of Machine Learning. The app helps users track their income and expenses, auto-categorize transactions, and provides insightful dashboard summaries.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Authentication System](#authentication-system)
- [API Documentation](#api-documentation)
- [Technologies](#technologies)
- [Contributing](#contributing)

## Overview

Moment is designed to assist individuals—especially students and young professionals—in managing their finances efficiently. By leveraging Machine Learning, the application automatically categorizes transactions based on their descriptions, while allowing manual adjustments when needed. This streamlined approach enables users to gain a clear understanding of their financial habits and make informed decisions.

## Features

- **User Authentication:** Secure registration and login system with JWT tokens.
- **Transaction Management:** Create, read, update, and delete financial transactions.
- **Auto-Categorization:** Machine Learning-powered categorization of transactions.
- **Manual Adjustments:** Users can modify categories if the auto-categorization isn't accurate.
- **Dashboard:** Visual summary of income, expenses, and recent transactions.
- **Responsive Design:** Optimized for desktops, tablets, and mobile devices.
- **API Security:** Protections including CSRF, rate limiting, and secure HTTP headers.

## Project Structure

- **Front-End:** 
  - Developed with React and Vite.
  - Styled using Tailwind CSS and Shadcn UI.
  - API services for communication with backend.
- **Back-End:**
  - Built with Node.js and Express.js.
  - Data is stored in MongoDB with Mongoose ODM.
  - JWT-based authentication for secure access.
  - Comprehensive validation middleware.
- **Machine Learning:**
  - Implemented in Python using Scikit-Learn.
  - Data processing with Pandas and NumPy.
  - Model saved and loaded using Joblib/Pickle for auto-categorization.

## Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/NojinNojs/moment.git
   ```

2. **Front-End Setup:**
   ```bash
   cd frontend
   npm install
   npm run setup-env  # Configure environment variables
   npm run dev
   ```

3. **Back-End Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Copy and edit with your configuration
   npm run dev
   ```

## Usage

- Open the landing page to learn more about the application.
- Register or log in to access your personalized dashboard.
- Manage your transactions (add, edit, delete) easily.
- Let the ML model auto-categorize your transactions and adjust manually when needed.
- Monitor your financial summary on the dashboard.

## Authentication System

Moment uses a secure JWT-based authentication system:

### Registration

1. Users create an account with their name, email, and password
2. Passwords are securely hashed using bcrypt before being stored in the database
3. Upon successful registration, a JWT token is provided for immediate login

### Login

1. Users provide their email and password
2. The system verifies credentials against the database
3. Upon successful verification, a JWT token is generated and returned
4. Frontend stores this token in localStorage for subsequent authenticated requests

### Authentication Flow

```
┌─────────┐                                 ┌─────────┐                         ┌─────────┐
│ Browser │                                 │ Server  │                         │ Database│
└────┬────┘                                 └────┬────┘                         └────┬────┘
     │                                           │                                   │
     │  POST /api/v1/auth/register               │                                   │
     │  {name, email, password}                  │                                   │
     ├───────────────────────────────────────────▶                                   │
     │                                           │                                   │
     │                                           │  Check if user exists             │
     │                                           ├───────────────────────────────────▶
     │                                           │                                   │
     │                                           │  Create user & hash password      │
     │                                           ├───────────────────────────────────▶
     │                                           │                                   │
     │                                           │  Generate JWT token               │
     │                                           │◀───────────────────────────────┘
     │                                           │                                   
     │  HTTP 201 {success: true, data: {token}}  │                                   
     │◀──────────────────────────────────────────┤                                   
     │                                           │                                   
     │  Store token in localStorage              │                                   
     │                                           │                                   
     │  GET /api/v1/auth/me                      │                                   
     │  Authorization: Bearer {token}            │                                   
     ├───────────────────────────────────────────▶                                   
     │                                           │  Verify token                     
     │                                           │  Get user data                    
     │                                           ├───────────────────────────────────▶
     │                                           │                                   │
     │  HTTP 200 {success: true, data: user}     │◀───────────────────────────────────┤
     │◀──────────────────────────────────────────┤                                   │
```

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

| Method | Endpoint        | Description                | Access      | Request Body                                | Response                                       |
|--------|-----------------|----------------------------|-------------|--------------------------------------------|-------------------------------------------------|
| POST   | /auth/register  | Register a new user        | Public      | `{name, email, password}`                  | `{success, message, data: {id, name, email, token}}` |
| POST   | /auth/login     | Authenticate user          | Public      | `{email, password}`                        | `{success, message, data: {id, name, email, token}}` |
| GET    | /auth/me        | Get current user profile   | Protected   | None (requires Auth header)                | `{success, message, data: {id, name, email}}`  |

### Transaction Endpoints

| Method | Endpoint               | Description                   | Access      |
|--------|------------------------|-------------------------------|-------------|
| GET    | /transactions          | Get all user transactions     | Protected   |
| POST   | /transactions          | Create a new transaction      | Protected   |
| GET    | /transactions/:id      | Get transaction by ID         | Protected   |
| PUT    | /transactions/:id      | Update transaction            | Protected   |
| DELETE | /transactions/:id      | Delete transaction            | Protected   |

### Using the API in Frontend

Our application provides convenient service modules for API communication:

```typescript
// Example usage in React components
import apiService from '../services/api';

// Login
const handleLogin = async (email, password) => {
  try {
    const response = await apiService.login(email, password);
    if (response.success) {
      // User is now logged in, token is stored automatically
      console.log('Welcome back!', response.data.user.name);
    }
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};

// Register
const handleRegister = async (userData) => {
  try {
    const response = await apiService.register(userData);
    if (response.success) {
      // User is now registered and logged in
      console.log('Welcome!', response.data.user.name);
    }
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
};

// Get profile (authenticated request)
const loadUserProfile = async () => {
  try {
    const response = await apiService.getProfile();
    if (response.success) {
      console.log('User profile:', response.data);
    }
  } catch (error) {
    console.error('Failed to load profile:', error.message);
  }
};
```

## Technologies

- **Front-End:** React, Vite, TypeScript, Tailwind CSS, Shadcn UI, Axios, React Router.
- **Back-End:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt.
- **Security:** Helmet.js, CSRF protection, rate limiting, input validation.
- **Machine Learning:** Python, Scikit-Learn, Pandas, NumPy, Joblib/Pickle.
- **Additional Tools:** VS Code, Postman, GitHub, Figma, Vercel.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your improvements or bug fixes.