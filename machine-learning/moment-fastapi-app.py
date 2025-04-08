from fastapi import FastAPI
from pydantic import BaseModel, validator
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import re
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

app = FastAPI(title="Indonesian Financial Text Classifier", 
             description="API for categorizing financial transactions in both Indonesian and English")

MODEL_PATH = "transaction-classifier/model_artifacts/finance_model.h5"
TOKENIZER_PATH = "transaction-classifier/model_artifacts/tokenizer.pkl"
LABEL_MAPPINGS_PATH = "transaction-classifier/model_artifacts/label_mappings.pkl"

# Flag to track if model loaded successfully
model_loaded = False

try:
    model = load_model(MODEL_PATH)
    
    with open(TOKENIZER_PATH, 'rb') as handle:
        tokenizer = pickle.load(handle)
    
    with open(LABEL_MAPPINGS_PATH, 'rb') as handle:
        label2id, id2label = pickle.load(handle)
    
    model_loaded = True
    print("Model and artifacts loaded successfully")
except Exception as e:
    print(f"Error loading model or artifacts: {str(e)}")
    # Initialize empty objects to avoid further errors
    model = None
    tokenizer = None
    label2id, id2label = {}, {}

factory = StemmerFactory()
lemmatizer = factory.create_stemmer()

FINANCIAL_TERMS = {
    "gopay": "gopay", "ovo": "ovo", "dana": "dana", 
    "bca": "bca", "kpr": "kpr", "pln": "pln",
    "bibit": "investasi", "membership": "member"
}

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    
    tokens = []
    for token in text.split():
        if token in FINANCIAL_TERMS:
            tokens.append(FINANCIAL_TERMS[token])
        else:
            stemmed = lemmatizer.stem(token)
            tokens.append(stemmed)
    
    return ' '.join(tokens)

class PredictionRequest(BaseModel):
    text: str
    type: str = None  # Transaction type: 'income' or 'expense'
    
    @validator('type')
    def validate_type(cls, v):
        if v is not None and v not in ['income', 'expense']:
            raise ValueError("Type must be either 'income', 'expense', or None")
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "text": "Pembelian di Indomaret", # Indonesian example
                "type": "expense"
            }
        }

class PredictionResponse(BaseModel):
    category: str
    confidence: float
    processed_text: str
    suggested_categories: list = []  # List of alternative suggestions
    
    class Config:
        schema_extra = {
            "example": {
                "category": "Groceries",
                "confidence": 0.85,
                "processed_text": "beli indomaret",
                "suggested_categories": [
                    {"category": "Groceries", "confidence": 0.85},
                    {"category": "Shopping", "confidence": 0.10},
                    {"category": "Food", "confidence": 0.05}
                ]
            }
        }

@app.post("/transaction-classifier", 
         response_model=PredictionResponse,
         summary="Categorize a financial transaction",
         description="Takes transaction description text in Indonesian or English and returns predicted category with confidence score")
async def predict(request: PredictionRequest):
    # Check if model was loaded successfully
    if not model_loaded:
        return {
            "category": "Error",
            "confidence": 0.0,
            "processed_text": request.text if hasattr(request, 'text') else "",
            "suggested_categories": [],
            "error": "Model not loaded. Please check server logs."
        }
        
    try:
        processed_text = preprocess_text(request.text)
        
        seq = tokenizer.texts_to_sequences([processed_text])
        padded = pad_sequences(seq, maxlen=model.input_shape[1], padding='post')
        
        proba = model.predict(padded, verbose=0)[0]
    except Exception as e:
        # Log the error
        print(f"Error in prediction: {str(e)}")
        # Return a fallback response with error information
        return {
            "category": "Unknown",
            "confidence": 0.0,
            "processed_text": request.text if hasattr(request, 'text') else "",
            "suggested_categories": [],
            "error": f"An error occurred during prediction: {str(e)}"
        }
    
    # Get top 3 predictions
    top_indices = proba.argsort()[-3:][::-1]
    top_categories = [id2label[idx] for idx in top_indices]
    top_probas = [float(proba[idx]) for idx in top_indices]
    
    # Get the most likely prediction
    pred_id = top_indices[0]
    
    # Consider transaction type if provided
    if request.type and request.type in ['income', 'expense']:
        # Filter or adjust categories based on transaction type
        income_categories = ["Salary", "Freelance", "Investment", "Gift", "Refund", "Bonus", "Allowance", 
                           "Holiday Bonus", "Small Business", "Rental", "Dividend", "Pension", "Asset Sale", 
                           "Inheritance", "Other"]
        
        expense_categories = ["Food & Dining", "Transportation", "Housing", "Utilities", "Internet & Phone", 
                             "Healthcare", "Entertainment", "Shopping", "Online Shopping", "Travel", 
                             "Education", "Children Education", "Debt Payment", "Charitable Giving", 
                             "Family Support", "Tax", "Insurance", "Subscriptions", "Personal Care", 
                             "Vehicle Maintenance", "Home Furnishing", "Clothing", "Electronics", 
                             "Hobbies", "Social Events", "Other"]
        
        if request.type == 'income':
            # Prioritize income categories
            filtered_indices = [i for i, cat in enumerate(top_categories) if cat in income_categories]
            if filtered_indices:
                # Reorder top categories to prioritize income categories
                top_indices = [top_indices[i] for i in filtered_indices] + [idx for i, idx in enumerate(top_indices) if i not in filtered_indices]
                top_categories = [id2label[idx] for idx in top_indices]
                top_probas = [float(proba[idx]) for idx in top_indices]
                pred_id = top_indices[0]
        elif request.type == 'expense':
            # Prioritize expense categories
            filtered_indices = [i for i, cat in enumerate(top_categories) if cat in expense_categories]
            if filtered_indices:
                # Reorder top categories to prioritize expense categories
                top_indices = [top_indices[i] for i in filtered_indices] + [idx for i, idx in enumerate(top_indices) if i not in filtered_indices]
                top_categories = [id2label[idx] for idx in top_indices]
                top_probas = [float(proba[idx]) for idx in top_indices]
                pred_id = top_indices[0]
    
    return {
        "category": id2label[pred_id],
        "confidence": float(proba[pred_id]),
        "processed_text": processed_text,
        "suggested_categories": [
            {"category": cat, "confidence": conf} 
            for cat, conf in zip(top_categories, top_probas)
        ]
    }

# Add a health check endpoint
@app.get("/health")
async def health_check():
    if model_loaded:
        return {"status": "ok", "message": "Service is running", "model_loaded": True}
    else:
        return {"status": "degraded", "message": "Service is running but model is not loaded", "model_loaded": False}

# Add documentation endpoint
@app.get("/")
async def api_info():
    return {
        "api_name": "Transaction Auto-Categorization API",
        "version": "1.0",
        "description": "Categorizes financial transactions based on text description in Indonesian or English",
        "endpoints": {
            "/transaction-classifier": "POST - Categorize a transaction",
            "/health": "GET - Health check"
        },
        "supported_languages": ["Indonesian", "English"],
        "usage_examples": [
            {
                "language": "Indonesian",
                "request": {
                    "text": "Pembelian di Indomaret",
                    "type": "expense"
                }
            },
            {
                "language": "English",
                "request": {
                    "text": "Grocery shopping at Walmart",
                    "type": "expense"
                }
            },
            {
                "language": "Indonesian",
                "request": {
                    "text": "Gaji bulanan",
                    "type": "income"
                }
            }
        ],
        "response_format": {
            "category": "string (predicted category)",
            "confidence": "float (0-1)",
            "processed_text": "string (preprocessed text)",
            "suggested_categories": [
                {
                    "category": "string (alternative category)",
                    "confidence": "float (0-1)"
                }
            ]
        }
    }
