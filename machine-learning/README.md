# Moment Financial Transaction Classifier

Machine learning service for financial transaction classification in Indonesian and English.

## Overview

This service uses a hybrid approach combining LSTM machine learning and rule-based keyword matching to classify financial transactions based on transaction description and type. It supports both Indonesian and English input.

## Features

- Financial transaction classification in Indonesian and English
- Hybrid classification approach (ML + rule-based keyword matching)
- Transaction type filtering (only suggests categories matching income/expense type)
- Default "Other" category fallback when confidence is low
- Type-specific suggestions for better user experience
- Smart confidence threshold (0.4) for reliable predictions
- Context-aware prediction explanations
- Health check endpoint
- Proper error handling
- Comprehensive API documentation

## API Endpoints

### 1. Transaction Classification

**Endpoint:** `POST /api/v1/classify`

**Request Body:**
```json
{
    "text": "Pembelian di Tokopedia",
    "type": "expense"
}
```

**Response Success (200) - High Confidence:**
```json
{
    "status": "success",
    "message": "Transaction successfully classified",
    "data": {
        "category": "Shopping",
        "confidence": 0.95,
        "processed_text": "pembelian di tokopedia",
        "explanation": "Category 'Shopping' was chosen because the description contains shopping-related terms",
        "suggestions": [
            {"category": "Groceries", "confidence": 0.03},
            {"category": "Entertainment", "confidence": 0.02}
        ]
    },
    "timestamp": "2024-04-07T10:00:00Z"
}
```

**Response Success (200) - Keyword Matching:**
```json
{
    "status": "success",
    "message": "Transaction classified using rule-based matching",
    "data": {
        "category": "Shopping",
        "confidence": 0.95,
        "processed_text": "beli baju lebaran",
        "explanation": "Category 'Shopping' was chosen because the description contains the keyword 'baju'",
        "suggestions": []
    },
    "timestamp": "2024-04-07T10:00:00Z"
}
```

**Response Success (200) - Low Confidence:**
```json
{
    "status": "success",
    "message": "Low confidence prediction, using default category",
    "data": {
        "category": "Other",
        "confidence": 0.24,
        "processed_text": "transaction description",
        "explanation": "Default category 'Other' was chosen because confidence was too low",
        "suggestions": [
            {"category": "Food & Dining", "confidence": 0.24},
            {"category": "Shopping", "confidence": 0.20},
            {"category": "Bills", "confidence": 0.18}
        ]
    },
    "timestamp": "2024-04-07T10:00:00Z"
}
```

**Response Error (400) - Validation Error:**
```json
{
    "status": "error",
    "message": "Invalid transaction type: other. Must be 'income' or 'expense'",
    "error_code": "VALIDATION_ERROR",
    "timestamp": "2024-04-07T10:00:00Z"
}
```

**Response Error (500):**
```json
{
    "status": "error",
    "message": "Failed to classify transaction: [error message]",
    "error_code": "CLASSIFICATION_ERROR",
    "timestamp": "2024-04-07T10:00:00Z"
}
```

### 2. Health Check

**Endpoint:** `GET /api/v1/health`

**Response:**
```json
{
    "status": "success",
    "message": "Service is running properly",
    "timestamp": "2024-04-07T10:00:00Z",
    "version": "1.0.0"
}
```

## Classification Methods

### 1. Keyword-Based Classification
The service first attempts to classify transactions using keyword matching against predefined dictionaries:

- Shopping keywords: baju, beli, belanja, tokopedia, shopee, etc.
- Food keywords: makan, restoran, café, gofood, etc.
- Transportation keywords: bensin, gojek, tiket, etc.
- Bills keywords: listrik, internet, tagihan, etc.
- Income keywords: gaji, bonus, pendapatan, etc.

### 2. Machine Learning Classification
If keyword matching fails to provide high-confidence results, the service uses an LSTM model to classify the transaction:

- The text is preprocessed (lowercased, stemmed)
- Only categories matching the transaction type (income/expense) are considered
- Confidence scores help determine the reliability of predictions

### 3. Fallback Strategy
When both methods yield low confidence:
- Special case for shopping-related terms (automatically uses "Shopping" category)
- Default to "Other" for expenses or "Income" for income transactions
- Provides suggestions from ML predictions

## Category Types
The service automatically categorizes suggestions based on the transaction type:

**Income Categories:**
- Income
- Salary
- Investments
- Gifts
- Savings & Investments

**Expense Categories:**
- Food & Dining
- Shopping 
- Transportation
- Bills
- Entertainment
- Housing
- Health
- Travel
- Education
- Personal
- Groceries
- Other

## 2. How To Setup A Virtual Environment
Virtual environments are important in python to help prevent conflicts between libraries and tools.

### **Windows**
```sh
python -m venv venv  # cmd for creating the virtual environment
venv\Scripts\activate  # cmd for activating it
```

### **macOS/Linux**
```sh
python3 -m venv venv  # cmd for creating the virtual environment
source venv/bin/activate  # cmd for activating it
```

## 3. Dependencies
There's a bunch of libs you might want to install before you can run this API.
You can just run this command to download all the necessary libs. `requieremnts.txt` is just a text file that contains all the library names.
```sh
pip install -r requirements.txt
```

## 4. How To Run The API
You have to use `uvicorn` to run the API.

```sh
uvicorn moment-fastapi-app:app --host 0.0.0.0 --port 8000 --reload
```

## 5. API Testing
After you run the API, visit **http://127.0.0.1:8000/docs** on your browser to have direct access to all endpoints.

## 6. Deactivate The Virtual Environment
After you're done with your shenanigans it's best to deactivate your virtual environment.<br>
*REMEMBER,* don't deactivate your venv if you still want to run the app or install any other tools.<br>
If you wanna run the API again be sure to activate your venv (Virtual Environment) first.<br>
Instructions on how to activate your venv can be viewed [here](#2-how-to-setup-a-virtual-environment).<br>
Running the API without activating your venv will result in unexpected behaviour.<br>
I'm tired of having to explain these things to non-python devs. Just follow my instruction and you'll be fine.<br>

```sh
deactivate  # this is the cmd to deactivate any venv
```

## Environment Variables

- `MODEL_PATH`: Path to H5 model
- `TOKENIZER_PATH`: Path to tokenizer pickle
- `LABEL_MAPPINGS_PATH`: Path to label mappings pickle

## Error Codes

- `CLASSIFICATION_ERROR`: Failed during classification process
- `MODEL_LOAD_ERROR`: Failed to load model or resources
- `VALIDATION_ERROR`: Invalid request

## Best Practices

1. **Error Handling**
   - Always check response status
   - Implement retry mechanism for transient errors
   - Log errors for debugging

2. **Performance**
   - Cache frequent predictions
   - Use batch processing for multiple requests
   - Monitor response time

3. **Security**
   - Validate input
   - Implement rate limiting
   - Use API key authentication

## Contributing

1. Fork repository
2. Create new branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License
