from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
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
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Paths
model_dir = "transaction-classifier/model_artifacts"
model_path = os.path.join(model_dir, "transaction_classifier_model.keras")
tokenizer_path = os.path.join(model_dir, "tokenizer.pkl")
label_encoder_path = os.path.join(model_dir, "label_encoder.pkl")

# Custom Attention Layer
class AttentionLayer(tf.keras.layers.Layer):
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)

    def build(self, input_shape):
        self.W = self.add_weight(name='att_weight', shape=(input_shape[-1], 1), initializer='random_normal', trainable=True)
        self.b = self.add_weight(name='att_bias', shape=(input_shape[1], 1), initializer='zeros', trainable=True)
        super(AttentionLayer, self).build(input_shape)

    def call(self, inputs):
        e = tf.keras.backend.tanh(tf.keras.backend.dot(inputs, self.W) + self.b)
        a = tf.keras.backend.softmax(e, axis=1)
        output = inputs * a
        return tf.keras.backend.sum(output, axis=1)

# Load model and artifacts
try:
    model = load_model(model_path, custom_objects={'AttentionLayer': AttentionLayer})
    with open(tokenizer_path, 'rb') as f:
        tokenizer = pickle.load(f)
    with open(label_encoder_path, 'rb') as f:
        label_encoder = pickle.load(f)
    model_loaded = True
    logger.info("Model and artifacts loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load model or artifacts: {e}")
    model_loaded = False

# Initialize FastAPI
app = FastAPI(title="Transaction Classifier API", version="1.0.0")

# Request model
class TextInput(BaseModel):
    text: str = Field(..., description="Transaction description text", min_length=1)
    type: Optional[str] = Field(None, description="Transaction type (if already known)")

    @validator('type')
    def validate_type(cls, v):
        if v is not None and not v.strip():
            return None
        return v

# Response model
class PredictionResponse(BaseModel):
    status: str
    timestamp: str
    request_id: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]

# Prediction logic
def predict_transaction(text: str):
    seq = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(seq, maxlen=model.input_shape[1], padding='post')
    pred = model.predict(padded, verbose=0)
    label_index = np.argmax(pred)
    label = label_encoder.inverse_transform([label_index])[0]
    confidence = float(np.max(pred))
    return label, confidence

# Main prediction endpoint
@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict(input: TextInput):
    if not model_loaded:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Model not loaded.")

    request_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()

    if input.type:
        category = input.type
        confidence = 1.0
    else:
        if not input.text.strip():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Text cannot be empty when type is not provided.")
        category, confidence = predict_transaction(input.text)

    return PredictionResponse(
        status="success",
        timestamp=timestamp,
        request_id=request_id,
        data={
            "category": category,
            "confidence": round(confidence, 4)
        },
        metadata={
            "model_version": "1.0.0",
            "transaction_type": input.type or "predicted"
        }
    )

# Health check endpoint
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok" if model_loaded else "degraded",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "model": "healthy" if model_loaded else "unavailable",
            "api": "healthy"
        },
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to the Transaction Classifier API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "True").lower() == "true"
    uvicorn.run("ml_api:app", host=host, port=port, reload=reload)
