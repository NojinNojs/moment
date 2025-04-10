from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, validator, Field
from typing import List, Optional, Dict, Any
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import re
import logging
from datetime import datetime
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Moment Financial Transaction Classifier API",
    description="API for automatically categorizing financial transactions in Indonesian and English",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Constants
MODEL_PATH = "transaction-classifier/model_artifacts/finance_model.h5"
TOKENIZER_PATH = "transaction-classifier/model_artifacts/tokenizer.pkl"
LABEL_MAPPINGS_PATH = "transaction-classifier/model_artifacts/label_mappings.pkl"

# Model artifacts
model_loaded = False
model = None
tokenizer = None
label2id = {}
id2label = {}

# Category lists
INCOME_CATEGORIES = [
    "Salary", "Freelance", "Investment", "Gift", "Refund", "Bonus", "Allowance",
    "Holiday Bonus", "Small Business", "Rental", "Dividend", "Pension", "Asset Sale",
    "Inheritance", "Other"
]

EXPENSE_CATEGORIES = [
    "Food & Dining", "Transportation", "Housing", "Utilities", "Internet & Phone",
    "Healthcare", "Entertainment", "Shopping", "Online Shopping", "Travel",
    "Education", "Children Education", "Debt Payment", "Charitable Giving",
    "Family Support", "Tax", "Insurance", "Subscriptions", "Personal Care",
    "Vehicle Maintenance", "Home Furnishing", "Clothing", "Electronics",
    "Hobbies", "Social Events", "Other"
]

# Financial terms mapping for preprocessing
FINANCIAL_TERMS = {
    "gopay": "gopay", "ovo": "ovo", "dana": "dana",
    "bca": "bca", "kpr": "kpr", "pln": "pln",
    "bibit": "investasi", "membership": "member"
}

# Response Models
class CategoryPrediction(BaseModel):
    category: str = Field(..., description="Predicted category name")
    confidence: float = Field(..., description="Confidence score between 0 and 1")

class PredictionResponse(BaseModel):
    status: str = Field(..., description="Response status (success/error)")
    timestamp: str = Field(..., description="Timestamp of the prediction")
    request_id: str = Field(..., description="Unique identifier for the request")
    data: Dict[str, Any] = Field(..., description="Response data containing predictions")
    metadata: Dict[str, Any] = Field(..., description="Additional metadata about the prediction")

class ErrorResponse(BaseModel):
    status: str = Field("error", description="Error status")
    timestamp: str = Field(..., description="Timestamp of the error")
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Additional error details")

class PredictionRequest(BaseModel):
    text: str = Field(..., description="Transaction description text", min_length=1)
    type: Optional[str] = Field(None, description="Transaction type (income/expense)")

    @validator('type')
    def validate_type(cls, v):
        if v is not None and v not in ['income', 'expense']:
            raise ValueError("Type must be either 'income', 'expense', or None")
        return v

    class Config:
        schema_extra = {
            "example": {
                "text": "Pembelian di Indomaret",
                "type": "expense"
            }
        }

# Initialize model and dependencies
def initialize_model():
    global model, tokenizer, label2id, id2label, model_loaded
    try:
        logger.info("Loading model and artifacts...")
        model = load_model(MODEL_PATH)
        
        with open(TOKENIZER_PATH, 'rb') as handle:
            tokenizer = pickle.load(handle)
        
        with open(LABEL_MAPPINGS_PATH, 'rb') as handle:
            label2id, id2label = pickle.load(handle)
        
        model_loaded = True
        logger.info("Model and artifacts loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model or artifacts: {str(e)}")
        model_loaded = False
        raise

# Text preprocessing
def preprocess_text(text: str) -> str:
    try:
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
    except Exception as e:
        logger.error(f"Error in text preprocessing: {str(e)}")
        raise

# Initialize Sastrawi stemmer
factory = StemmerFactory()
lemmatizer = factory.create_stemmer()

# Initialize model on startup
try:
    initialize_model()
except Exception as e:
    logger.error(f"Failed to initialize model: {str(e)}")

@app.post(
    "/api/v1/predict",
    response_model=PredictionResponse,
    responses={
        200: {"description": "Successful prediction"},
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Server error"}
    },
    tags=["Prediction"]
)
async def predict_category(request: PredictionRequest):
    if not model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please try again later."
        )

    try:
        # Generate request ID and timestamp
        request_id = f"pred_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        timestamp = datetime.now().isoformat()

        # Preprocess text
        processed_text = preprocess_text(request.text)
        
        # Generate prediction
        seq = tokenizer.texts_to_sequences([processed_text])
        padded = pad_sequences(seq, maxlen=model.input_shape[1], padding='post')
        proba = model.predict(padded, verbose=0)[0]

        # Get all predictions and sort by probability
        all_predictions = [(id2label[i], float(p)) for i, p in enumerate(proba)]
        all_predictions.sort(key=lambda x: x[1], reverse=True)

        # Filter categories based on transaction type
        if request.type:
            valid_categories = INCOME_CATEGORIES if request.type == 'income' else EXPENSE_CATEGORIES
            filtered_predictions = [(cat, conf) for cat, conf in all_predictions if cat in valid_categories]
            
            if not filtered_predictions:
                # Fallback to "Other" category if no matching categories found
                default_cat = "Other"
                filtered_predictions = [(default_cat, float(proba[label2id[default_cat]]))]
            
            top_predictions = filtered_predictions[:3]
        else:
            top_predictions = all_predictions[:3]

        # Prepare response
        response_data = {
            "primary_category": {
                "category": top_predictions[0][0],
                "confidence": top_predictions[0][1]
            },
            "alternative_categories": [
                {"category": cat, "confidence": conf}
                for cat, conf in top_predictions[1:]
            ],
            "processed_text": processed_text
        }

        return PredictionResponse(
            status="success",
            timestamp=timestamp,
            request_id=request_id,
            data=response_data,
            metadata={
                "model_version": "1.0.0",
                "preprocessing_applied": True,
                "transaction_type": request.type,
                "language_support": ["Indonesian", "English"]
            }
        )

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get(
    "/api/v1/health",
    tags=["System"],
    responses={
        200: {"description": "System health information"}
    }
)
async def health_check():
    return {
        "status": "ok" if model_loaded else "degraded",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "model": "healthy" if model_loaded else "unavailable",
            "api": "healthy"
        },
        "version": "1.0.0"
    }

@app.get(
    "/api/v1/categories",
    tags=["Categories"],
    responses={
        200: {"description": "List of available categories"}
    }
)
async def get_categories():
    return {
        "income_categories": INCOME_CATEGORIES,
        "expense_categories": EXPENSE_CATEGORIES
    }

@app.get("/", tags=["Documentation"])
async def api_info():
    return {
        "name": "Moment Financial Transaction Classifier API",
        "version": "1.0.0",
        "description": "Auto-categorization API for financial transactions",
        "endpoints": {
            "/api/v1/predict": {
                "method": "POST",
                "description": "Predict transaction category",
                "request_format": {
                    "text": "string (required)",
                    "type": "string (optional: 'income' or 'expense')"
                }
            },
            "/api/v1/health": {
                "method": "GET",
                "description": "Check system health"
            },
            "/api/v1/categories": {
                "method": "GET",
                "description": "Get available categories"
            }
        },
        "documentation": {
            "openapi": "/docs",
            "redoc": "/redoc"
        }
    }
