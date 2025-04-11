from fastapi import FastAPI, HTTPException, status, Depends
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Any
import numpy as np
import pickle
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os
import uvicorn
import logging
from datetime import datetime
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define paths
model_dir = "transaction-classifier/model_artifacts"
model_path = os.path.join(model_dir, "transaction_classifier_model.keras")
tokenizer_path = os.path.join(model_dir, "tokenizer.pkl")
label_encoder_path = os.path.join(model_dir, "label_encoder.pkl")

# Model and artifacts state
model_loaded = False

# Category definitions
INCOME_CATEGORIES = [
    "Salary", "Freelance", "Investment", "Gift", "Refund", "Bonus", "Allowance",
    "Small Business", "Rental", "Dividend", "Pension", "Asset Sale", "Other"
]

EXPENSE_CATEGORIES = [
    "Food & Dining", "Transportation", "Housing", "Utilities", "Internet & Phone",
    "Healthcare", "Entertainment", "Shopping", "Travel", "Education", "Debt Payment",
    "Charitable Giving", "Family Support", "Tax", "Insurance", "Subscriptions",
    "Personal Care", "Vehicle Maintenance", "Clothing", "Electronics", "Other"
]

# Load model and artifacts
class AttentionLayer(tf.keras.layers.Layer):
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)

    def build(self, input_shape):
        self.W = self.add_weight(name='att_weight', shape=(input_shape[-1], 1),
                                 initializer='random_normal', trainable=True)
        self.b = self.add_weight(name='att_bias', shape=(input_shape[1], 1),
                                 initializer='zeros', trainable=True)
        super(AttentionLayer, self).build(input_shape)

    def call(self, inputs):
        e = tf.keras.backend.tanh(tf.keras.backend.dot(inputs, self.W) + self.b)
        a = tf.keras.backend.softmax(e, axis=1)
        output = inputs * a
        return tf.keras.backend.sum(output, axis=1)

try:
    model = load_model(model_path, custom_objects={'AttentionLayer': AttentionLayer})
    
    with open(tokenizer_path, 'rb') as f:
        tokenizer = pickle.load(f)
    
    with open(label_encoder_path, 'rb') as f:
        label_encoder = pickle.load(f)
    
    model_loaded = True
    logger.info(f"Successfully loaded model and artifacts from {model_dir}")
except FileNotFoundError as e:
    logger.error(f"Error: Could not find model artifact file: {e}")
    model_loaded = False
except Exception as e:
    logger.error(f"Error loading model or artifacts: {e}")
    model_loaded = False

# Initialize app
app = FastAPI(
    title="Moment Financial Transaction Classifier API",
    description="API for automatically categorizing financial transactions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Input schema
class TextInput(BaseModel):
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
                "text": "Payment for groceries at Supermart",
                "type": "expense"
            }
        }

# Response models
class CategoryPrediction(BaseModel):
    category: str = Field(..., description="Predicted category name")
    confidence: float = Field(..., description="Confidence score between 0 and 1")

class PredictionResponse(BaseModel):
    status: str = Field("success", description="Response status")
    timestamp: str = Field(..., description="Timestamp of the prediction")
    request_id: str = Field(..., description="Unique identifier for the request")
    data: Dict[str, Any] = Field(..., description="Response data containing predictions")
    metadata: Dict[str, Any] = Field(..., description="Additional metadata about the prediction")

class ErrorResponse(BaseModel):
    status: str = Field("error", description="Error status")
    timestamp: str = Field(..., description="Timestamp of the error")
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Additional error details")

# Dependency for checking model status
def verify_model_loaded():
    if not model_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Please try again later."
        )
    return True

# Prediction function
def predict_transaction(text: str):
    if not text.strip():
        return "EMPTY_INPUT", 0.0
    
    seq = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(seq, maxlen=model.input_shape[1], padding='post')
    pred = model.predict(padded, verbose=0)  # Suppress verbose output
    label_index = np.argmax(pred)
    label = label_encoder.inverse_transform([label_index])[0]
    confidence = float(np.max(pred))
    
    # Get top 3 predictions with labels and confidence
    top_indices = np.argsort(pred[0])[-3:][::-1]
    top_predictions = [
        (label_encoder.inverse_transform([idx])[0], float(pred[0][idx]))
        for idx in top_indices
    ]
    
    return label, confidence, top_predictions

# Endpoints
@app.post(
    "/api/v1/predict",
    response_model=PredictionResponse,
    responses={
        200: {"description": "Successful prediction"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Server error"},
        503: {"model": ErrorResponse, "description": "Model unavailable"}
    },
    tags=["Prediction"]
)
def predict_category(input: TextInput, model_loaded: bool = Depends(verify_model_loaded)):
    """
    Predict the category of a financial transaction.
    
    This endpoint takes a transaction description and optional transaction type,
    and returns predicted categories with confidence scores.
    """
    try:
        # Generate request ID and timestamp
        request_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        # Get prediction
        label, confidence, top_predictions = predict_transaction(input.text)
        
        # Filter predictions based on transaction type if specified
        if input.type:
            valid_categories = INCOME_CATEGORIES if input.type == 'income' else EXPENSE_CATEGORIES
            filtered_predictions = [(cat, conf) for cat, conf in top_predictions if cat in valid_categories]
            
            if filtered_predictions:
                top_predictions = filtered_predictions
            else:
                # Fallback to 'Other' category if no matching categories
                top_predictions = [("Other", 0.5)]
        
        # Prepare response
        primary_category = top_predictions[0]
        alternative_categories = top_predictions[1:] if len(top_predictions) > 1 else []
        
        response_data = {
            "primary_category": {
                "category": primary_category[0],
                "confidence": round(primary_category[1], 4)
            },
            "alternative_categories": [
                {"category": cat, "confidence": round(conf, 4)}
                for cat, conf in alternative_categories
            ]
        }
        
        return PredictionResponse(
            status="success",
            timestamp=timestamp,
            request_id=request_id,
            data=response_data,
            metadata={
                "model_version": "1.0.0",
                "transaction_type": input.type
            }
        )
    except ValueError as e:
        # Return 422 Unprocessable Entity for validation errors
        timestamp = datetime.now().isoformat()
        error_response = ErrorResponse(
            status="error",
            timestamp=timestamp,
            error="Validation error",
            details=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=error_response.dict()
        )
    except Exception as e:
        # Return 500 Internal Server Error for other errors
        logger.error(f"Error processing request: {e}")
        timestamp = datetime.now().isoformat()
        error_response = ErrorResponse(
            status="error",
            timestamp=timestamp,
            error="Internal server error",
            details="An error occurred during prediction"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_response.dict()
        )

@app.get(
    "/api/v1/health",
    tags=["System"],
    responses={
        200: {"description": "System health information"}
    }
)
def health_check():
    """
    Check the health status of the API and its components.
    
    Returns information about the service status, model availability,
    and system uptime.
    """
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
def get_categories():
    """
    Get a list of all available transaction categories.
    
    Returns separate lists for income and expense categories.
    """
    return {
        "income_categories": INCOME_CATEGORIES,
        "expense_categories": EXPENSE_CATEGORIES
    }

@app.get("/", tags=["Documentation"])
def api_info():
    """
    Get general information about the API.
    
    Returns details about the API name, version, endpoints, and documentation.
    """
    return {
        "name": "Moment Financial Transaction Classifier API",
        "version": "1.0.0",
        "description": "Auto-categorization API for financial transactions",
        "endpoints": {
            "/api/v1/predict": "Predict transaction category",
            "/api/v1/health": "Check system health",
            "/api/v1/categories": "Get available categories"
        },
        "documentation": {
            "openapi": "/docs",
            "redoc": "/redoc"
        }
    }

# For local testing
if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "True").lower() == "true"
    uvicorn.run("ml-api:app", host=host, port=port, reload=reload)
