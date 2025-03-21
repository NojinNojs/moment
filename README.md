# Moment - Personal Financial Management Application

![Moment Logo](public/logo.png)

A modern financial management platform that helps users track expenses, analyze spending patterns, and build better financial habits with AI-powered features.

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Authentication System](#authentication-system)
- [Contributing](#contributing)

## 🔍 Overview

Moment is designed for students and young professionals who want to take control of their finances. The application automatically categorizes transactions using machine learning while providing a clean, intuitive interface for manual adjustments when needed. This approach gives users clear insights into their spending habits and helps them make informed financial decisions.

## ✨ Key Features

- **Smart Transaction Management**
  - Create, view, update, and delete financial transactions
  - AI-powered automatic categorization
  - Manual category overrides when needed

- **Secure Authentication**
  - JWT-based authentication system
  - Protected routes and API endpoints
  - Secure password handling with bcrypt

- **Responsive Dashboard**
  - Visual summaries of income and expenses
  - Spending trends and patterns
  - Recent transaction timeline

- **Enterprise-Grade Security**
  - CSRF protection
  - Rate limiting
  - Secure HTTP headers
  - Data validation

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI**: Tailwind CSS + Shadcn UI components
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT
- **Validation**: Express-validator

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Version Control**: Git
- **Deployment**: Vercel

## 📂 Project Structure

The project is organized into two main modules:

```
moment/
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── lib/          # Utilities and helpers
│   │   └── ...
│   ├── public/           # Static assets
│   └── ...               # Configuration files
│
├── backend/              # Express.js backend API
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route handlers
│   │   ├── middlewares/  # Custom middleware
│   │   ├── models/       # Mongoose data models
│   │   ├── routes/       # API routes
│   │   └── ...
│   ├── scripts/          # Utility scripts
│   │   └── setup-env.js  # Environment setup script
│   └── ...               # Configuration files
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
   cd moment
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run setup-env  # Automatically sets up environment variables
   npm run dev
   ```
   The API will be available at http://localhost:3000/api/v1

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   npm run setup-env  # Automatically sets up environment variables
   npm run dev
   ```
   The app will be available at http://localhost:5173

### Environment Setup

Both frontend and backend have automated environment setup scripts that:

- Create appropriate environment files for development
- Generate secure keys and tokens
- Configure database connections
- Set up CORS and other security settings
- Link frontend and backend configurations

You can run these scripts manually if needed:

```bash
# For backend environment setup
cd backend
npm run setup-env

# For frontend environment setup
cd frontend
npm run setup-env
```

## 📝 Usage

1. **Access the application**
   - Open your browser and navigate to http://localhost:5173
   - Register a new account or log in with test credentials

2. **Explore the features**
   - Add new transactions and see how they're automatically categorized
   - View your financial summary on the dashboard
   - Explore detailed transaction history

3. **API Documentation**
   - The interactive API documentation is available at http://localhost:3000/api/docs
   - Use it to explore available endpoints and test them directly

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

Interactive API documentation is available at `/api/docs` when the server is running.

### Main Endpoints

#### Authentication
| Method | Endpoint        | Description                | Access      |
|--------|-----------------|----------------------------|-------------|
| POST   | /auth/register  | Register a new user        | Public      |
| POST   | /auth/login     | Authenticate user          | Public      |
| GET    | /auth/me        | Get current user profile   | Protected   |

#### Transactions
| Method | Endpoint               | Description                   | Access      |
|--------|------------------------|-------------------------------|-------------|
| GET    | /transactions          | Get all user transactions     | Protected   |
| POST   | /transactions          | Create a new transaction      | Protected   |
| GET    | /transactions/:id      | Get transaction by ID         | Protected   |
| PUT    | /transactions/:id      | Update transaction            | Protected   |
| DELETE | /transactions/:id      | Delete transaction            | Protected   |

## 🔐 Authentication System

Moment uses a secure JWT-based authentication system with the following flow:

1. **Registration/Login**: User provides credentials
2. **Token Generation**: Server validates credentials and returns a JWT token
3. **Token Storage**: Frontend stores the token in localStorage
4. **Authenticated Requests**: Token is included in the Authorization header
5. **Token Verification**: Server validates the token for protected routes

### Example API Usage
```typescript
import apiService from '../services/api';

// Login
const handleLogin = async (email, password) => {
  try {
    const response = await apiService.login(email, password);
    // Handle successful login
  } catch (error) {
    // Handle error
  }
};

// Get profile (authenticated request)
const loadUserProfile = async () => {
  try {
    const response = await apiService.getProfile();
    // Process user data
  } catch (error) {
    // Handle error
  }
};
```

## 👥 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.