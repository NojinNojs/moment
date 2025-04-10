# Moment Financial Transaction Classifier API

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-brightgreen.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95+-ff69b4.svg)

A powerful machine learning API for automatically categorizing financial transactions in both Indonesian and English languages. Built with FastAPI and TensorFlow, this API provides accurate transaction categorization with confidence scores and alternative suggestions.

## 📚 Table of Contents
- [Features](#features)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Development Setup](#development-setup)
- [API Endpoints](#api-endpoints)
- [Supported Categories](#supported-categories)
- [Contributing](#contributing)

## ✨ Features
- Bilingual support (Indonesian and English)
- Smart transaction categorization
- Multiple category suggestions with confidence scores
- Standardized API responses with request tracking
- Comprehensive error handling
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
   uvicorn moment-fastapi-app:app --host 0.0.0.0 --port 8000 --reload
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
// Request Body
{
    "text": "string",       // Required: Transaction description
    "type": "string"        // Optional: 'income' or 'expense'
}

// Response
{
    "status": "success",
    "timestamp": "2024-03-21T12:34:56.789Z",
    "request_id": "pred_20240321_123456",
    "data": {
        "primary_category": {
            "category": "string",
            "confidence": 0.95
        },
        "alternative_categories": [
            {
                "category": "string",
                "confidence": 0.85
            }
        ],
        "processed_text": "string"
    },
    "metadata": {
        "model_version": "1.0.0",
        "preprocessing_applied": true,
        "language_support": ["Indonesian", "English"]
    }
}
```

### 2. Get Available Categories
**Endpoint:** `/api/v1/categories`  
**Method:** `GET`

Returns lists of supported income and expense categories.

### 3. Health Check
**Endpoint:** `/api/v1/health`  
**Method:** `GET`

Monitors API health status and component availability.

## 🎯 Supported Categories

### Income Categories
- Salary
- Freelance
- Investment
- Gift
- Refund
- And more...

### Expense Categories
- Food & Dining
- Transportation
- Housing
- Utilities
- Healthcare
- And more...

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

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
