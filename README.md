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
  - [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [API Documentation](#api-documentation)
- [Authentication System](#authentication-system)
- [Core Functionality](#core-functionality)
  - [Transaction Management](#transaction-management)
  - [Asset Management](#asset-management)
  - [Dashboard Analytics](#dashboard-analytics)
  - [User Profile Management](#user-profile-management)
- [Architecture](#architecture)
- [State Management](#state-management)
- [Testing Strategy](#testing-strategy)
- [Deployment](#deployment)
- [Performance Optimization](#performance-optimization)
- [Security Measures](#security-measures)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🔍 Overview

Moment is designed for students and young professionals who want to take control of their finances. The application automatically categorizes transactions using machine learning while providing a clean, intuitive interface for manual adjustments when needed. This approach gives users clear insights into their spending habits and helps them make informed financial decisions.

## ✨ Key Features

- **Smart Transaction Management**
  - Create, view, update, and delete financial transactions
  - AI-powered automatic categorization
  - Manual category overrides when needed
  - Soft delete with trash management and recovery options
  - Batch operations for efficient management

- **Asset Management**
  - Track multiple financial accounts in one place
  - Monitor account balances and transaction history
  - Transfer funds between accounts with detailed tracking
  - View asset performance over time

- **Financial Dashboard**
  - Visual summaries of income and expenses
  - Spending trends analysis with interactive charts
  - Financial health indicators and personalized insights
  - Monthly and yearly comparisons with historical data
  - Exportable reports in multiple formats

- **Secure Authentication**
  - JWT-based authentication system
  - Protected routes and API endpoints
  - Secure password handling with bcrypt
  - Session management with refresh tokens

- **Responsive Design**
  - Fully responsive UI that works on mobile, tablet, and desktop
  - Dark and light mode support with system preference detection
  - Accessible design following WCAG guidelines
  - Progressive Web App (PWA) capabilities

- **Enterprise-Grade Security**
  - CSRF protection
  - Rate limiting and brute force protection
  - Secure HTTP headers
  - Data validation and sanitization
  - Regular security audits

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI**: Tailwind CSS + Shadcn UI components for consistent design
- **State Management**: React Context API with custom hooks
- **HTTP Client**: Axios with request/response interceptors
- **Animations**: Framer Motion for smooth transitions and microinteractions
- **Form Handling**: React Hook Form with Zod validation
- **Data Visualization**: Recharts for responsive and interactive charts
- **Internationalization**: i18next for multi-language support

### Backend
- **Runtime**: Node.js (LTS version)
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh token rotation
- **Validation**: Express-validator for request validation
- **Documentation**: Swagger/OpenAPI for API documentation
- **Logging**: Winston for structured logging
- **Testing**: Jest with Supertest for API testing

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint with custom rule configuration
- **Type Checking**: TypeScript with strict mode
- **Version Control**: Git with conventional commit messages
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Deployment**: Vercel (Frontend), Custom VPS/Cloud (Backend)
- **Monitoring**: Application performance monitoring with Sentry

## 📂 Project Structure

The project follows a modern modular architecture with separate frontend and backend:

```
moment/
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── dashboard/# Dashboard-specific components
│   │   │   ├── ui/       # Base UI components (shadcn)
│   │   │   └── ...       # Other component categories
│   │   ├── contexts/     # React Context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   ├── pages/        # Page components 
│   │   │   ├── auth/     # Authentication pages
│   │   │   ├── dashboard/# Dashboard pages
│   │   │   └── ...       # Other page categories
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript type definitions
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
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   ├── scripts/          # Utility scripts
│   │   └── setup-env.js  # Environment setup script
│   └── ...               # Configuration files
```

### Key Architecture Decisions

- **Component-Based Architecture**: UI is built with reusable components
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
- **API-First Approach**: Backend and frontend communicate exclusively through the API
- **Type Safety**: Comprehensive TypeScript types shared between frontend and backend
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced with JS

## 🚀 Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm (v7.x or higher)
- MongoDB (local instance or MongoDB Atlas account)
- Git

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
   npm run setup-env  # Sets up environment variables interactively
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   npm run setup-env  # Sets up environment variables interactively
   ```

### Environment Setup

Both frontend and backend have automated environment setup scripts that will guide you through the configuration process:

**Backend Environment Setup**
- Database connection details
- JWT configuration
- API settings
- Default admin account

**Frontend Environment Setup**
- API endpoint configuration
- Theme settings
- Feature toggles

For manual setup, refer to the detailed environment setup guides:
- [Backend Environment Setup](./backend/ENV_SETUP.md)
- [Frontend Environment Variables](./frontend/readme.md#environment-setup)

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   The API will be available at http://localhost:3000/api/v1

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The app will be available at http://localhost:5173

3. **Access the Application**
   - Open your browser and navigate to http://localhost:5173
   - Register a new account or use the default test account:
     - Email: `test@example.com`
     - Password: `password123`

4. **Explore Key Features**
   - Dashboard: View financial overview
   - Transactions: Manage your income and expenses
   - Assets: Track and manage your accounts
   - Reports: Generate financial reports

## 🔄 Development Workflow

### Code Structure and Standards

- **Component Organization**: Components are organized by feature and follow a consistent structure
- **TypeScript**: All code is strongly typed with TypeScript
- **State Management**: React Context API is used for global state
- **Styling**: Tailwind CSS with custom theme configuration
- **API Communication**: Centralized API service with Axios
- **Error Handling**: Consistent error handling patterns throughout the application
- **Performance**: Regular performance audits and optimizations

### Recommended Development Flow

1. **Pull latest changes** from the repository
2. **Create a feature branch** for your work (e.g., `feature/add-budget-tracking`)
3. **Implement changes** following the project coding standards
4. **Run linting** to ensure code quality
   ```bash
   # For frontend
   cd frontend
   npm run lint
   
   # For backend
   cd backend
   npm run lint
   ```
5. **Test your changes** thoroughly
   ```bash
   # For frontend
   cd frontend
   npm run test
   
   # For backend
   cd backend
   npm run test
   ```
6. **Create a pull request** with a clear description of your changes
7. **Address review feedback** and ensure CI checks pass
8. **Merge** once approved

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Common types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect the code (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `test`: Adding or modifying tests
- `chore`: Changes to the build process or auxiliary tools

Example: `feat(transactions): add bulk delete functionality`

## 📚 API Documentation

Interactive API documentation is available at `/api/docs` when the backend server is running.

### Base URL
```
http://localhost:3000/api/v1
```

### Main API Features

- **Authentication API**: User registration, login, profile management, password reset
- **Transactions API**: CRUD operations for financial transactions
- **Categories API**: Predefined and custom transaction categories
- **Assets API**: Financial account management
- **Transfers API**: Asset-to-asset transfer operations
- **Dashboard API**: Aggregated financial data for dashboards
- **Reports API**: Custom financial report generation

### API Response Format

All API endpoints return responses in a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Or in case of an error:

```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ]  // Optional array of specific errors
}
```

For detailed API documentation, see [Backend API Documentation](./backend/readme.md#api-documentation).

## 🔐 Authentication System

Moment uses a secure JWT-based authentication system:

1. **User Registration/Login**: The frontend collects credentials and sends them to the backend
2. **Token Generation**: The backend validates credentials and returns a JWT token
3. **Token Storage**: The frontend stores the token in localStorage
4. **Authenticated Requests**: The token is included in the Authorization header for API requests
5. **Protected Routes**: Both API endpoints and frontend routes are protected
6. **Token Refresh**: Access tokens are refreshed automatically to maintain sessions

### Authentication Flow Example

```typescript
// Login flow
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await apiService.login(email, password);
    if (response.success) {
      // Token is automatically stored by the API service
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Protected API request
const fetchTransactions = async () => {
  try {
    // Token is automatically included in the request
    const response = await apiService.getTransactions();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
};
```

## 💰 Core Functionality

### Transaction Management

Transactions represent financial activities (income or expenses) and form the core of the application:

- **Create transactions** with amount, category, date, and description
- **View transaction history** with filtering and sorting
- **Edit transaction details** as needed
- **Delete transactions** with soft delete (move to trash) and permanent delete options
- **Restore deleted transactions** from the trash
- **Categorize transactions** automatically or manually
- **Attach receipts** and additional documentation to transactions
- **Add notes** for future reference
- **Set up recurring transactions** for regular expenses or income

### Asset Management

Assets represent financial accounts that hold user funds:

- **Create multiple asset types** (cash, bank account, credit card, etc.)
- **Track balances** across accounts
- **Transfer funds** between assets
- **View asset history** and transaction breakdown
- **Monitor asset growth** over time
- **Set target balances** for savings goals
- **Tag assets** for better organization (e.g., personal, business)
- **Archive unused assets** without deleting history

### Dashboard Analytics

The dashboard provides financial insights:

- **Income vs. Expense breakdown** with interactive charts
- **Monthly trends** for financial activities
- **Category analysis** to identify spending patterns
- **Financial health indicators** based on saving rate and spending habits
- **Predictive analytics** for future expenses and income
- **Budget vs. actual spending** comparisons
- **Savings rate tracking** over time
- **Highest expense categories** identification

### User Profile Management

- **Update personal information** including name, email, and profile picture
- **Change password** with security verification
- **Set notification preferences** for various system events
- **Configure default settings** for the application
- **Export personal data** in compliance with data protection regulations
- **Delete account** with proper data handling

## 🏛️ Architecture

### Frontend Architecture

- **Component Architecture**: Reusable, composable UI components
- **Container/Presentational Pattern**: Separation of data fetching and presentation
- **Custom Hooks**: Encapsulated business logic in reusable hooks
- **Context Providers**: Global state management with React Context API
- **Route-Based Code Splitting**: Dynamic imports to optimize bundle size
- **Service Layer**: Centralized API communication
- **Error Boundaries**: Graceful error handling in the component tree

### Backend Architecture

- **MVC Pattern**: Controllers handle requests, services contain business logic, models define data structure
- **Middleware Pipeline**: Request processing through configurable middleware
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Error Handling Middleware**: Centralized error processing
- **Authentication Middleware**: Request authentication and authorization
- **Validation Middleware**: Request data validation

## 🔄 State Management

### Frontend State Management

- **Application State**: Global state managed with React Context
- **UI State**: Local component state with useState/useReducer
- **Server State**: Managed with custom hooks for data fetching
- **Form State**: Handled with React Hook Form
- **URL State**: Route parameters and query strings for shareable state

### Backend State Management

- **Database**: Persistent state in MongoDB
- **Caching**: In-memory caching for frequent queries
- **Session State**: User authentication state in JWT tokens
- **Request State**: Per-request context throughout the middleware pipeline

## 🧪 Testing Strategy

### Frontend Testing

- **Unit Tests**: Testing individual components and hooks
- **Integration Tests**: Testing component interactions
- **E2E Tests**: Testing complete user flows
- **Visual Regression Tests**: Ensuring UI consistency

### Backend Testing

- **Unit Tests**: Testing individual functions and utilities
- **Integration Tests**: Testing API endpoints
- **Database Tests**: Testing data access and manipulation
- **Authentication Tests**: Testing security mechanisms

## 🚢 Deployment

### Frontend Deployment

The frontend is optimized for deployment to Vercel:

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically from your main branch

For manual deployment:
```bash
cd frontend
npm run build
# Deploy the dist/ directory to your web server
```

### Backend Deployment

The backend can be deployed to any Node.js hosting service:

1. Set up a MongoDB instance (MongoDB Atlas recommended for production)
2. Configure production environment variables
3. Build and start the production server:
   ```bash
   cd backend
   npm run build
   npm start
   ```

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment:
- Automated testing on pull requests
- Linting and type checking
- Production builds for merged changes
- Automatic deployment to staging/production environments

For detailed deployment instructions, see [Deployment Guide](./docs/deployment.md).

## ⚡ Performance Optimization

### Frontend Optimizations

- **Code Splitting**: Reduce initial load time with dynamic imports
- **Tree Shaking**: Remove unused code from the bundle
- **Asset Optimization**: Compress and optimize images and other assets
- **Lazy Loading**: Load components and data when needed
- **Memoization**: Prevent unnecessary re-renders
- **Service Worker**: Cache assets and API responses
- **Virtual Lists**: Efficiently render large data sets

### Backend Optimizations

- **Database Indexing**: Optimize query performance
- **Query Optimization**: Efficient data retrieval
- **Caching**: Reduce database load
- **Compression**: Reduce response size
- **Connection Pooling**: Optimize database connections
- **Pagination**: Handle large data sets efficiently

## 🔒 Security Measures

### Frontend Security

- **Input Validation**: Client-side validation before submission
- **XSS Protection**: Escape user-generated content
- **CSRF Protection**: Tokens for form submissions
- **Content Security Policy**: Restrict resource loading
- **Secure Storage**: Properly handle sensitive data

### Backend Security

- **Authentication**: Secure user authentication
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation
- **Rate Limiting**: Prevent abuse
- **Helmet**: Secure HTTP headers
- **Encryption**: Protect sensitive data
- **Logging**: Security event monitoring
- **Regular Updates**: Keep dependencies up-to-date

## ❓ Troubleshooting

### Common Issues

**Frontend Issues:**
- **API Connection Errors**: Ensure the backend is running and CORS is configured correctly
- **Authentication Issues**: Clear localStorage and try logging in again
- **UI Rendering Problems**: Check for console errors and component state
- **Form Submission Errors**: Verify input validation and API request format
- **Performance Issues**: Check for memory leaks or expensive re-renders

**Backend Issues:**
- **Database Connection Errors**: Verify MongoDB connection string and network access
- **JWT Errors**: Check JWT_SECRET and token expiration settings
- **API Validation Errors**: Ensure request data matches required schema
- **Performance Bottlenecks**: Look for slow queries or inefficient operations
- **Memory Leaks**: Monitor resource utilization

### Debugging Tips

- **Frontend Debugging**:
  - Use React DevTools to inspect component state and props
  - Check browser console for errors
  - Use network tab to inspect API requests
  - Add breakpoints in development tools

- **Backend Debugging**:
  - Check logs for detailed error information
  - Use debugging tools like Node.js inspector
  - Test API endpoints with Postman or similar tools
  - Verify database queries with MongoDB Compass

## 👥 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes with descriptive messages
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate documentation for new features.

### Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing component structure
- Use functional components with hooks
- Add JSDoc comments for functions and components
- Maintain strong type safety with proper interfaces
- Write unit tests for new functionality
- Follow accessibility best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

© 2023 Moment Financial. All rights reserved.