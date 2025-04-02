from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import re
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

app = FastAPI(title="Indonesian Financial Text Classifier")

MODEL_PATH = "transaction-classifier/model_artifacts/finance_model.h5"
TOKENIZER_PATH = "transaction-classifier/model_artifacts/tokenizer.pkl"
LABEL_MAPPINGS_PATH = "transaction-classifier/model_artifacts/label_mappings.pkl"

model = load_model(MODEL_PATH)

with open(TOKENIZER_PATH, 'rb') as handle:
    tokenizer = pickle.load(handle)

with open(LABEL_MAPPINGS_PATH, 'rb') as handle:
    label2id, id2label = pickle.load(handle)

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

class PredictionResponse(BaseModel):
    category: str
    confidence: float
    processed_text: str

@app.post("/transaction-classifier", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    processed_text = preprocess_text(request.text)
    
    seq = tokenizer.texts_to_sequences([processed_text])
    padded = pad_sequences(seq, maxlen=model.input_shape[1], padding='post')
    
    proba = model.predict(padded, verbose=0)[0]
    pred_id = np.argmax(proba)
    
    return {
        "category": id2label[pred_id],
        "confidence": float(proba[pred_id]),
        "processed_text": processed_text
    }
