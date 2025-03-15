# Backend/chatbot_model/flask_app.py
import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Suppress oneDNN warnings

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import tensorflow as tf
import pickle
import numpy as np
import pandas as pd
import logging
import re

# Set up detailed logging for debugging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load model, tokenizer, label encoder, and dataset at startup
try:
    model = load_model('best_chatbot_model.keras', compile=False)  # Updated to .keras format
    with open('tokenizer.pkl', 'rb') as handle:
        tokenizer = pickle.load(handle)
    with open('label_encoder.pkl', 'rb') as f:
        label_encoder = pickle.load(f)
    data_df = pd.read_csv('dataset_chatbot_updated.csv')
    logger.debug("Model, tokenizer, label encoder, and dataset loaded successfully.")
    logger.debug(f"Dataset shape: {data_df.shape}, Columns: {data_df.columns.tolist()}")
    logger.debug(f"Unique intents in dataset: {data_df['Intent'].unique()}")
    logger.debug(f"Unique languages in dataset: {data_df['Language'].unique()}")
    logger.debug(f"Dataset sample:\n{data_df.head().to_string()}")
except Exception as e:
    logger.error(f"Failed to load model components or dataset: {e}")
    raise

MAX_NUM_WORDS = 5000
MAX_SEQ_LENGTH = 50

@tf.function(reduce_retracing=True)
def predict_with_model(padded_seq):
    return model(padded_seq)

def detect_language(query):
    """
    Detect if the query is in Sinhala or English based on character range.
    Sinhala Unicode range: U+0D80 to U+0DFF
    """
    try:
        sinhala_pattern = re.compile(r'[\u0D80-\u0DFF]')
        if sinhala_pattern.search(query):
            logger.debug(f"Detected Sinhala characters in query: {query}")
            return 'Sinhala'
        logger.debug(f"No Sinhala characters detected, assuming English for query: {query}")
        return 'English'
    except Exception as e:
        logger.error(f"Error detecting language for query '{query}': {e}")
        return 'English'  # Fallback

def chatbot_predict(query, health_condition):
    try:
        logger.debug(f"Processing query: {query} with health condition: {health_condition}")

        # Detect the query language
        query_language = detect_language(query)
        logger.debug(f"Detected query language: {query_language}")

        # Tokenize and predict intent
        seq = tokenizer.texts_to_sequences([query])
        logger.debug(f"Tokenized sequence: {seq}")
        padded_seq = pad_sequences(seq, maxlen=MAX_SEQ_LENGTH)
        logger.debug(f"Padded sequence shape: {padded_seq.shape}")

        prediction = np.argmax(predict_with_model(padded_seq), axis=1)
        logger.debug(f"Raw prediction output: {prediction}")
        predicted_intent = label_encoder.inverse_transform(prediction)[0]
        logger.debug(f"Predicted intent: {predicted_intent}")

        # Validate health condition in intent
        if health_condition != 'general' and health_condition.lower().replace(' ', '_') not in predicted_intent:
            logger.warning(f"Health condition '{health_condition}' not in predicted intent '{predicted_intent}', reconstructing intent")
            predicted_intent = f"{predicted_intent.split('_for_')[0]}_for_{health_condition.lower().replace(' ', '_')}"
            logger.debug(f"Reconstructed intent: {predicted_intent}")

        # Filter responses based on intent and language
        filtered_df = data_df[(data_df['Intent'] == predicted_intent) & (data_df['Language'] == query_language)]
        logger.debug(f"Filtered dataset for intent '{predicted_intent}' and language '{query_language}': {filtered_df.shape[0]} rows")

        # If no response in the correct language, log an error and return a message
        if filtered_df.empty:
            logger.error(f"No {query_language} response found for intent '{predicted_intent}'")
            return f"Sorry, I don't have a {query_language} response for this query. Please try another language."

        # Validate response health condition
        for _, row in filtered_df.iterrows():
            response_health_condition = row.get('Health Condition', row.get('Condition', 'general'))
            if health_condition.lower().replace(' ', '_') not in predicted_intent.lower():
                logger.warning(f"Response health condition '{response_health_condition}' does not match user health condition '{health_condition}' for intent '{predicted_intent}'")

        logger.debug(f"Matching intents in dataset: {data_df['Intent'].unique()}")
        logger.debug(f"Filtered responses (language: {query_language}): {filtered_df['Response'].values}")
        bot_response = filtered_df['Response'].values[0] if len(filtered_df) > 0 else "Sorry, I don't understand your question."
        logger.debug(f"Final bot response: {bot_response}")
        response_language = detect_language(bot_response)
        logger.debug(f"Response language (inferred): {response_language}")
        if response_language != query_language:
            logger.error(f"Language mismatch: Query language '{query_language}', Response language '{response_language}'")

        return bot_response
    except Exception as e:
        logger.error(f"Prediction failed for query '{query}' with condition '{health_condition}': {e}")
        return "Sorry, an error occurred while processing your request."

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        logger.debug(f"Received request data: {data}")
        user_input = data.get('message')
        user_id = data.get('userId')
        health_condition = data.get('healthCondition', 'general')
        if not user_input:
            logger.warning("No message provided in request")
            return jsonify({'error': 'No message provided'}), 400
        if not user_id:
            logger.warning("No userId provided in request")
            return jsonify({'error': 'No userId provided'}), 400

        bot_response = chatbot_predict(user_input, health_condition)
        logger.debug(f"Returning response: {bot_response}")
        return jsonify({'response': bot_response})
    except Exception as e:
        logger.error(f"Chat endpoint failed: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    try:
        logger.debug("App starting...")
        app.run(debug=True, host='0.0.0.0', port=5002)
    except Exception as e:
        logger.error(f"App failed to start: {e}")