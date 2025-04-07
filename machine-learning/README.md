# Machine Learning API Documentation

## 1. API Endpoints

### Transaction Classifier
**Endpoint:** `http://127.0.0.1:8000/transaction-classifier`

**Method:** `POST`

**Request Body:**
```json
{
  "text": "string",       // Required: Transaction description
  "type": "string"        // Optional: Transaction type ('income' or 'expense')
}
```

**Response:**
```json
{
  "category": "string",           // Most likely category
  "confidence": 0.0,              // Confidence score (0-1)
  "processed_text": "string",     // Preprocessed text
  "suggested_categories": [       // Alternative suggestions
    {
      "category": "string",
      "confidence": 0.0
    }
  ]
}
```

### Health Check
**Endpoint:** `http://127.0.0.1:8000/health`

**Method:** `GET`

**Response:**
```json
{
  "status": "ok",
  "message": "Service is running"
}
```

### API Documentation
**Endpoint:** `http://127.0.0.1:8000`

**Method:** `GET`

Returns information about available endpoints and example usage.

## 2. How To Setup A Virtual Environment
Virtual environments are important in Python to help prevent conflicts between libraries and tools.

### **Windows**
```sh
python -m venv venv  # Creates the virtual environment
venv\Scripts\activate  # Activates the virtual environment
```

### **macOS/Linux**
```sh
python3 -m venv venv  # Creates the virtual environment
source venv/bin/activate  # Activates the virtual environment
```

## 3. Dependencies
Install all required dependencies using:
```sh
pip install -r requirements.txt
```

## 4. How To Run The API
Run the API using uvicorn with:

```sh
uvicorn moment-fastapi-app:app --host 0.0.0.0 --port 8000 --reload
```

## 5. API Testing
After running the API, you can:
- Visit **http://127.0.0.1:8000/docs** for Swagger UI documentation
- Use the interactive API documentation to test endpoints directly

## 6. Supported Languages
The transaction classifier supports both Indonesian and English text inputs, with a focus on Indonesian financial terminology.

## 7. Deactivating The Virtual Environment
When you're done working with the API, deactivate your virtual environment:

```sh
deactivate
```

**IMPORTANT NOTES:**
- Don't deactivate your virtual environment if you still want to run the app or install additional tools
- If you want to run the API again, be sure to activate your virtual environment first
- Running the API without activating your virtual environment will result in unexpected behavior
- See [How To Setup A Virtual Environment](#2-how-to-setup-a-virtual-environment) for activation instructions
