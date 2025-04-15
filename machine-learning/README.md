# Moment Financial Transaction Classifier API

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-brightgreen.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95+-ff69b4.svg)

A powerful machine learning API for automatically categorizing financial transactions. Built with FastAPI and TensorFlow, this API provides accurate transaction categorization with confidence scores and alternative suggestions.

## 📚 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [API Endpoints](#api-endpoints)
- [Supported Categories](#supported-categories)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

## ✨ Features

- Smart transaction categorization with machine learning
- Multiple category suggestions with confidence scores
- Support for both income and expense categories
- Transaction type filtering
- Standardized API responses with request tracking
- Comprehensive error handling and status codes
- Interactive API documentation
- Health monitoring endpoint
- Robust input validation

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

1. Clone the repository
2. Set up virtual environment:

   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API:
   ```bash
   python ml-api.py
   ```

## 📖 API Documentation

### Interactive Documentation

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## 🛠 API Endpoints

### 1. Predict Transaction Category

**Endpoint:** `/api/v1/predict`  
**Method:** `POST`

```json
// Contoh Request Body
{
  "text": "investasi stocks apple",
  "type": null
}

// Contoh Response
{
  "status": "success",
  "timestamp": "2025-04-13T21:06:53.450030",
  "request_id": "27320a26-bfed-4630-ae4b-cc7e4ac12e7a",
  "data": {
    "category": "Investment",
    "confidence": 0.7402
  },
  "metadata": {
    "model_version": "1.0.0",
    "transaction_type": "predicted"
  }
}
```

### 2. Health Check

**Endpoint:** `/api/v1/health`  
**Method:** `GET`

```json
// Response
{
    "status": "ok",
    "timestamp": "2024-03-21T12:34:56.789Z",
    "components": {
        "model": "healthy",
        "api": "healthy"
    },
    "version": "1.0.0"
}
```

### 3. Get Categories

**Endpoint:** `/api/v1/categories`  
**Method:** `GET`

```json
// Response
{
    "income_categories": [
        "Salary", "Freelance", "Investment", "Gift", "Refund", 
        "Bonus", "Allowance", "Small Business", "Rental", 
        "Dividend", "Pension", "Asset Sale", "Other"
    ],
    "expense_categories": [
        "Food & Dining", "Transportation", "Housing", "Utilities",
        "Internet & Phone", "Healthcare", "Entertainment", "Shopping", 
        "Travel", "Education", "Debt Payment", "Charitable Giving",
        "Family Support", "Tax", "Insurance", "Subscriptions",
        "Personal Care", "Vehicle Maintenance", "Clothing", 
        "Electronics", "Other"
    ]
}
```

### 4. API Information

**Endpoint:** `/`  
**Method:** `GET`

Returns general information about the API, including available endpoints and documentation links.

## 🎯 Supported Categories

### Income Categories

- Salary
- Freelance
- Investment
- Gift
- Refund
- Bonus
- Allowance
- Small Business
- Rental
- Dividend
- Pension
- Asset Sale
- Other

### Expense Categories

- Food & Dining
- Transportation
- Housing
- Utilities
- Internet & Phone
- Healthcare
- Entertainment
- Shopping
- Travel
- Education
- Debt Payment
- Charitable Giving
- Family Support
- Tax
- Insurance
- Subscriptions
- Personal Care
- Vehicle Maintenance
- Clothing
- Electronics
- Other

## 🔧 Environment Variables

The API supports the following environment variables for configuration:

- `HOST`: The host to run the server on (default: "0.0.0.0")
- `PORT`: The port to run the server on (default: 8000)
- `RELOAD`: Whether to enable auto-reload for development (default: "True")

## ⚠️ Important Notes

1. Always activate your virtual environment before running the API
2. Keep dependencies up to date
3. Check the API health endpoint before making predictions
4. Use appropriate error handling in your applications

## 🔌 Deactivating Virtual Environment

When you're done working with the API, you can deactivate the virtual environment using:

```bash
deactivate
```

**Note:** Make sure to save all your work before deactivating. You'll need to reactivate the virtual environment next time you want to work with the API.

---

Made with ❤️ by the Moment Team
