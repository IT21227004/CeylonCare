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
from google.cloud import speech_v1p1beta1 as speech
from werkzeug.utils import secure_filename

# Set up detailed logging for debugging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Verify Google Cloud setup
try:
    import google.cloud.speech
    logger.debug(f"Google Cloud Speech library version: {google.cloud.speech.__version__}")
except ImportError as e:
    logger.error(f"Google Cloud Speech library not installed: {e}")
    raise

credentials_env = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not credentials_env:
    logger.error("Environment variable GOOGLE_APPLICATION_CREDENTIALS not set")
    raise EnvironmentError("GOOGLE_APPLICATION_CREDENTIALS not set")
logger.debug(f"GOOGLE_APPLICATION_CREDENTIALS set to: {credentials_env}")
credentials_path = os.path.abspath(credentials_env)
if not os.path.exists(credentials_path):
    logger.error(f"Credentials file not found at: {credentials_path}")
    raise FileNotFoundError("Google Cloud credentials file not found")

# Load model, tokenizer, label encoder, and dataset at startup
try:
    model = load_model('best_chatbot_model.keras', compile=False)
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

def transcribe_audio(audio_file_path, language_code="en-US"):
    """
    Transcribe audio using Google Cloud Speech-to-Text API.
    """
    try:
        logger.debug(f"Transcribing audio file: {audio_file_path} with language: {language_code}")
        client = speech.SpeechClient()
        with open(audio_file_path, "rb") as audio_file:
            content = audio_file.read()
        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code=language_code,
        )
        response = client.recognize(config=config, audio=audio)
        logger.debug(f"Speech-to-Text API response: {response}")
        if not response.results:
            logger.warning("No transcription results returned from Speech-to-Text API")
            return ""
        transcript = response.results[0].alternatives[0].transcript
        logger.debug(f"Transcribed text: {transcript}")
        return transcript
    except Exception as e:
        logger.error(f"Failed to transcribe audio: {e}")
        return ""

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

        # Store the original predicted intent
        original_intent = predicted_intent

        # Reconstruct intent if health condition is provided and doesn't match
        if health_condition != 'general' and health_condition.lower().replace(' ', '_') not in predicted_intent:
            logger.warning(f"Health condition '{health_condition}' not in predicted intent '{predicted_intent}', reconstructing intent")
            reconstructed_intent = f"{predicted_intent.split('_for_')[0]}_for_{health_condition.lower().replace(' ', '_')}"
            logger.debug(f"Reconstructed intent: {reconstructed_intent}")
        else:
            reconstructed_intent = predicted_intent

        # Try filtering with reconstructed intent first
        filtered_df = data_df[(data_df['Intent'] == reconstructed_intent) & (data_df['Language'] == query_language)]
        logger.debug(f"Filtered dataset for intent '{reconstructed_intent}' and language '{query_language}': {filtered_df.shape[0]} rows")

        # If reconstructed intent yields no results, fall back to original intent
        if filtered_df.empty and reconstructed_intent != original_intent:
            logger.warning(f"No responses found for reconstructed intent '{reconstructed_intent}', falling back to original intent '{original_intent}'")
            filtered_df = data_df[(data_df['Intent'] == original_intent) & (data_df['Language'] == query_language)]
            logger.debug(f"Filtered dataset for original intent '{original_intent}' and language '{query_language}': {filtered_df.shape[0]} rows")

        # If still empty, try a general intent as a last resort
        if filtered_df.empty:
            general_intent = f"{predicted_intent.split('_for_')[0]}_for_general"
            logger.warning(f"No responses found for original intent '{original_intent}', trying general intent '{general_intent}'")
            filtered_df = data_df[(data_df['Intent'] == general_intent) & (data_df['Language'] == query_language)]
            logger.debug(f"Filtered dataset for general intent '{general_intent}' and language '{query_language}': {filtered_df.shape[0]} rows")

        # If no response is found, return an error message
        if filtered_df.empty:
            logger.error(f"No {query_language} response found for any intent (reconstructed: '{reconstructed_intent}', original: '{original_intent}', general: '{general_intent}')")
            return f"Sorry, I don't have a {query_language} response for this query. Please try another language or clarify your health condition."

        # Validate response health condition (optional, can be removed if not critical)
        for _, row in filtered_df.iterrows():
            response_health_condition = row.get('Health Condition', row.get('Condition', 'general'))
            if health_condition.lower().replace(' ', '_') not in reconstructed_intent.lower():
                logger.warning(f"Response health condition '{response_health_condition}' does not match user health condition '{health_condition}' for intent '{reconstructed_intent}'")

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

@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            logger.warning("No audio file provided in request")
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        user_id = request.form.get('userId')
        language_code = request.form.get('languageCode', 'en-US')
        health_condition = request.form.get('healthCondition', 'general')

        if not user_id:
            logger.warning("No userId provided in request")
            return jsonify({'error': 'No userId provided'}), 400

        # Save the audio file temporarily
        filename = secure_filename(audio_file.filename)
        audio_path = os.path.join("uploads", filename)
        os.makedirs("uploads", exist_ok=True)
        audio_file.save(audio_path)
        logger.debug(f"Audio file saved to: {audio_path}")

        # Transcribe the audio
        transcript = transcribe_audio(audio_path, language_code)
        if not transcript:
            logger.error("Transcription failed or returned empty result")
            return jsonify({'error': 'Failed to transcribe audio'}), 500

        # Clean up the saved audio file
        try:
            os.remove(audio_path)
            logger.debug(f"Cleaned up audio file: {audio_path}")
        except Exception as e:
            logger.warning(f"Failed to clean up audio file {audio_path}: {e}")

        # Pass the transcribed text to chatbot_predict
        bot_response = chatbot_predict(transcript, health_condition)
        logger.debug(f"Transcription result: {transcript}")
        logger.debug(f"Bot response for transcribed text: {bot_response}")

        return jsonify({'transcript': transcript, 'response': bot_response})
    except Exception as e:
        logger.error(f"Transcription endpoint failed: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    try:
        logger.debug("App starting...")
        app.run(debug=True, host='0.0.0.0', port=5001)
    except Exception as e:
        logger.error(f"App failed to start: {e}")