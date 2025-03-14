import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from flask import Flask, request, jsonify
from flask_cors import CORS
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
import tensorflow as tf
import pickle
import numpy as np
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
import logging
from sklearn.preprocessing import LabelEncoder

# Set up detailed logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load Firebase credentials
try:
    cred = credentials.Certificate("../firebase-service-account.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.debug("Firebase initialized successfully.")
except Exception as e:
    logger.error(f"Firebase initialization failed: {e}")

# Load model, tokenizer, label encoder, and dataset
try:
    model = load_model('best_chatbot_model.keras', compile=False)  # Updated to .keras
    with open('tokenizer.pkl', 'rb') as handle:
        tokenizer = pickle.load(handle)
    with open('label_encoder.pkl', 'rb') as f:
        label_encoder = pickle.load(f)
    data_df = pd.read_csv('dataset_chatbot.csv')
    logger.debug("Model, tokenizer, label encoder, and dataset loaded successfully.")
    logger.debug(f"Unique intents in dataset: {data_df['Intent'].unique()}")
except Exception as e:
    logger.error(f"Failed to load model components or dataset: {e}")
    raise

MAX_NUM_WORDS = 5000
MAX_SEQ_LENGTH = 50

@tf.function(reduce_retracing=True)
def predict_with_model(padded_seq):
    return model(padded_seq)

def get_user_health_condition(user_id):
    try:
        user_ref = db.collection('healthData').document(user_id).get()
        if user_ref.exists:
            health_condition = user_ref.to_dict().get('healthCondition', 'general')
            logger.debug(f"Retrieved health condition for user {user_id}: {health_condition}")
            return health_condition
        logger.warning(f"No health data found for user {user_id}")
        return 'general'
    except Exception as e:
        logger.error(f"Error fetching health condition for user {user_id}: {e}")
        return 'general'

def chatbot_predict(query, user_id=None):
    try:
        logger.debug(f"Processing query: {query}")
        seq = tokenizer.texts_to_sequences([query])
        logger.debug(f"Tokenized sequence: {seq}")
        padded_seq = pad_sequences(seq, maxlen=MAX_SEQ_LENGTH)
        logger.debug(f"Padded sequence shape: {padded_seq.shape}")

        prediction = np.argmax(predict_with_model(padded_seq), axis=1)
        logger.debug(f"Raw prediction output: {prediction}")
        predicted_intent_base = label_encoder.inverse_transform(prediction)[0]
        logger.debug(f"Base predicted intent: {predicted_intent_base}")

        # Get user health condition if available
        health_condition = 'general'
        if user_id:
            health_condition = get_user_health_condition(user_id).lower().replace(' ', '_')

        # Adjust intent based on health condition
        predicted_intent = predicted_intent_base
        if health_condition != 'general':
            predicted_intent = f"{predicted_intent_base.lower().replace(' ', '_')}_for_{health_condition}"

        logger.debug(f"Adjusted predicted intent: {predicted_intent}")

        # Filter response based on intent
        response = data_df[data_df['Intent'] == predicted_intent]['Response'].values
        logger.debug(f"Matching intents in dataset: {data_df['Intent'].unique()}")
        logger.debug(f"Found responses for intent '{predicted_intent}': {response}")
        bot_response = response[0] if len(response) > 0 else "Sorry, I don't understand your question."
        logger.debug(f"Final bot response: {bot_response}")

        return bot_response
    except Exception as e:
        logger.error(f"Prediction failed for query '{query}': {e}")
        return "Sorry, an error occurred while processing your request."

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        logger.debug(f"Received request data: {data}")
        user_input = data.get('message')
        user_id = data.get('userId')
        if not user_input:
            logger.warning("No message provided in request")
            return jsonify({'error': 'No message provided'}), 400

        bot_response = chatbot_predict(user_input, user_id)
        logger.debug(f"Returning response: {bot_response}")
        return jsonify({'response': bot_response})
    except Exception as e:
        logger.error(f"Chat endpoint failed: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    try:
        logger.debug("App starting...")
        app.run(debug=True, host='0.0.0.0', port=5001)
    except Exception as e:
        logger.error(f"App failed to start: {e}")