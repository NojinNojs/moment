from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
import pickle
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os
import uvicorn

# Define paths
model_dir = "transaction-classifier/model_artifacts"
model_path = os.path.join(model_dir, "transaction_classifier_model.keras")
tokenizer_path = os.path.join(model_dir, "tokenizer.pkl")
label_encoder_path = os.path.join(model_dir, "label_encoder.pkl")

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

model = load_model(model_path, custom_objects={'AttentionLayer': AttentionLayer})

with open(tokenizer_path, 'rb') as f:
    tokenizer = pickle.load(f)

with open(label_encoder_path, 'rb') as f:
    label_encoder = pickle.load(f)

# Initialize app
app = FastAPI()

# Input schema
class TextInput(BaseModel):
    text: str

# Prediction function
def predict_transaction(text: str):
    seq = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(seq, maxlen=model.input_shape[1], padding='post')
    pred = model.predict(padded)
    label_index = np.argmax(pred)
    label = label_encoder.inverse_transform([label_index])[0]
    confidence = float(np.max(pred))
    return label, confidence

# English endpoint
@app.post("/predict-category/en")
def predict_english(input: TextInput):
    label, confidence = predict_transaction(input.text)
    return {"language": "english", "label": label, "confidence": round(confidence, 4)}

# Indonesian endpoint
@app.post("/predict-category/id")
def predict_indonesian(input: TextInput):
    label, confidence = predict_transaction(input.text)
    return {"language": "indonesian", "label": label, "confidence": round(confidence, 4)}

# For local testing
if __name__ == "__main__":
    uvicorn.run("moment-fastapi-app:app", host="0.0.0.0", port=8000, reload=True)
