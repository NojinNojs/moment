# Moment - Personal Financial Management Application

![Moment Logo](frontend/public/banner.svg)

A straightforward personal finance application that helps users track their expenses and manage their financial accounts.

## 📑 Table of Contents

- [Overview](#overview)
- [Actual Features](#actual-features)
- [Setup Guide](#setup-guide)
  - [Step 1: System Requirements](#step-1-system-requirements)
  - [Step 2: Install Required Software](#step-2-install-required-software)
  - [Step 3: Database Setup](#step-3-database-setup)
  - [Step 4: Clone and Install Project](#step-4-clone-and-install-project)
  - [Step 5: Environment Configuration](#step-5-environment-configuration)
  - [Step 6: Run the Application](#step-6-run-the-application)
  - [Step 7: Verify Installation](#step-7-verify-installation)
- [Using the Application](#using-the-application)
  - [Dashboard Navigation](#dashboard-navigation)
  - [Managing Transactions](#managing-transactions)
  - [Managing Assets](#managing-assets)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🔍 Overview

Moment is a financial management application designed to help users track their expenses and manage their financial accounts. It provides a simple interface for recording transactions, categorizing them, and monitoring account balances.

## ✨ Actual Features

- **Transaction Management**
  - Create, view, and edit financial transactions
  - Categorize transactions by type (income or expense)
  - Filter transactions by date, category, and type
  - Basic transaction history view

- **Asset Management**
  - Track different financial accounts (bank, cash, etc.)
  - Record account balances
  - Transfer funds between accounts
  - View transaction history for each account

- **Dashboard Overview**
  - Summary of financial status
  - Income and expense breakdown
  - Recent transaction list
  - Account balance summary

- **Basic Authentication**
  - User registration and login
  - JWT-based authentication
  - Secure password handling

- **Responsive Design**
  - Works on mobile, tablet, and desktop devices
  - Dark and light mode support

- **Smart Transaction Categorization**
  - ML-powered automatic transaction categorization
  - Intelligent category suggestions based on transaction descriptions
  - Confidence scoring for category predictions
  - Continuous learning from user corrections

## 📋 Setup Guide

### Step 1: System Requirements

- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: 4GB minimum
- **Disk Space**: 1GB free space
- **Internet Connection**: Required for setup and MongoDB Atlas (if used)

### Step 2: Install Required Software

1. **Install Node.js (v16.x or higher)**:
   - Download from [Node.js official website](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Install Git**:
   - Download from [Git official website](https://git-scm.com/downloads)
   - Verify installation: `git --version`

3. **Install MongoDB Compass (optional)**:
   - Download from [MongoDB Compass website](https://www.mongodb.com/products/compass)
   - This GUI tool helps visualize your MongoDB data

4. **Install Python (v3.8 or higher) - Required for ML Service**:
   - Download from [Python official website](https://www.python.org/downloads/)
   - Verify installation: `python --version` or `python3 --version`
   - Ensure pip is installed: `pip --version` or `pip3 --version`

### Step 3: Database Setup

Choose one of the following options:

#### Option A: MongoDB Atlas (Cloud Database)

1. Create a free MongoDB Atlas account:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Complete the registration process

2. Set up a new cluster:
   - Click "Build a Cluster" 
   - Select the FREE tier
   - Choose your preferred cloud provider
   - Select a region closest to your location
   - Click "Create Cluster"

3. Configure database access:
   - Create a username and password
   - Set privileges to "Read and Write to Any Database"

4. Configure network access:
   - Add your IP address or allow access from anywhere for development

5. Get your connection string:
   - Click "Connect" > "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your password

#### Option B: Local MongoDB Installation

1. Install MongoDB Community Edition:
   - [Windows installation guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
   - [macOS installation guide](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)
   - [Linux installation guide](https://docs.mongodb.com/manual/administration/install-on-linux/)

2. Start the MongoDB service:
   - Windows: MongoDB should start as a service automatically
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

3. Your connection string for local development will be: `mongodb://localhost:27017/momentdb`

### Step 4: Clone and Install Project

1. **Clone the repository**:
   ```bash
   git clone https://github.com/NojinNojs/moment.git
   cd moment
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   ```

### Step 5: Environment Configuration

The project includes automated setup scripts for backend, frontend, and ML service environments.

#### Backend Environment Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the setup script:
   ```bash
   npm run setup-env
   ```

3. Follow the interactive prompts to configure:
   - Environment selection (development/production)
   - MongoDB connection string
   - JWT secret
   - Admin user credentials
   - API configuration
   - ML service settings
   - Other environment-specific settings

The script will generate both `.env` and `.env.[environment]` files with your configuration.

#### Frontend Environment Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Run the setup script:
   ```bash
   npm run setup-env
   ```

3. Follow the interactive prompts to configure:
   - Environment selection (local/production)
   - API URL
   - API key (will be synchronized with backend if available)
   - App name and other settings

The script will generate `.env.local` for development or `.env.production` for production.

#### ML Service Setup

1. Navigate to the machine-learning directory:
   ```bash
   cd ../machine-learning
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. The ML service configuration will be automatically synchronized with your backend settings through the backend setup script.

### Step 6: Run the Application

1. **Start the Backend Server**:
   ```bash
   # In the backend directory
   npm run dev
   ```

2. **Start the Frontend Development Server**:
   ```bash
   # In the frontend directory
   npm run dev
   ```

3. **Start the ML Service**:
   ```bash
   # In the machine-learning directory (with venv activated)
   python ml-api.py
   ```

### Step 7: Verify Installation

1. Open your browser and navigate to: `http://localhost:5173`
2. Create a new account by registering
3. Log in with your credentials

## 🧭 Using the Application

### Dashboard Navigation

The main dashboard contains:

1. **Overview**: Summary of financial status
2. **Transactions**: Manage income and expenses
3. **Assets**: Manage your accounts
4. **Settings**: Update user profile

### Managing Transactions

1. **Adding a Transaction**:
   - Click "Add Transaction"
   - Select transaction type (income or expense)
   - Enter amount, date, category, and description
   - Select the account
   - Click "Save"

2. **Editing a Transaction**:
   - Click on the transaction in the list
   - Update the details
   - Click "Save"

3. **Filtering Transactions**:
   - Use the date range selector
   - Filter by category or type
   - Search by description

### Managing Assets

1. **Creating an Account**:
   - Click "Add Asset"
   - Select asset type (bank account, cash, etc.)
   - Enter name and initial balance
   - Click "Save"

2. **Transferring Between Accounts**:
   - Click "Transfer"
   - Select source and destination accounts
   - Enter amount
   - Add description
   - Click "Transfer"

## 🛠️ Tech Stack

### Frontend
- React with TypeScript
- Vite build tool
- Tailwind CSS for styling
- React Context API for state management
- Axios for API requests

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- Express-validator for input validation

## 📂 Project Structure

The project consists of separate frontend, backend, and machine learning codebases:

```
moment/
├── frontend/            # React frontend application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── ...
│   └── ...
│
├── backend/             # Express backend API
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   └── ...
│   └── ...
│
└── machine-learning/    # Python ML service
    ├── transaction-classifier/  # ML model and training
    ├── ml-api.py       # FastAPI service
    └── requirements.txt # Python dependencies
```

## 🧠 Machine Learning Features

The ML service provides intelligent transaction categorization through:

- **Automatic Categorization**
  - Real-time prediction of transaction categories
  - Natural language processing of transaction descriptions
  - Multi-language support for transaction text

- **Smart Learning**
  - Continuous model improvement from user feedback
  - Confidence scoring for predictions
  - Fallback to rule-based categorization when confidence is low

- **Performance**
  - Fast prediction response times (<100ms)
  - Caching of frequent predictions
  - Batch prediction support for multiple transactions

- **Integration**
  - RESTful API for easy integration
  - Swagger/OpenAPI documentation
  - Health monitoring endpoints

## 📚 API Documentation

When running the development servers, documentation is available at:
- Backend API: `http://localhost:3000/api/docs`
- ML Service API: `http://localhost:8000/docs`

## ❓ Troubleshooting

### Common Setup Issues

1. **MongoDB Connection Failures**:
   - Check your connection string
   - Verify your IP is whitelisted in MongoDB Atlas
   - Ensure MongoDB service is running locally

2. **NPM Install Errors**:
   - Try `npm install --legacy-peer-deps`
   - Delete `node_modules` and reinstall

3. **Port Already in Use**:
   - Change the port in the `.env` file
   - Or find and terminate the process using the port

### Application Issues

1. **Login Failures**:
   - Check that your credentials are correct
   - Verify the backend is running

2. **Transaction Creation Issues**:
   - Ensure all required fields are filled out
   - Check that the selected account exists

## 👥 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

Please follow the existing code style and add tests where appropriate.

## 📄 License

This project is licensed under the MIT License.

---

© 2023 Moment Financial.