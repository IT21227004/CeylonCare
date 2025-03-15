# Backend/chatbot_model/validate_dataset.py
import pandas as pd
import numpy as np
import re

# Load the dataset
df = pd.read_csv('dataset_chatbot_updated.csv')

# Function to detect language of a text
def detect_language(text):
    try:
        text_str = str(text)  # Convert to string to handle NaN
        sinhala_pattern = re.compile(r'[\u0D80-\u0DFF]')
        return 'Sinhala' if sinhala_pattern.search(text_str) else 'English'
    except Exception as e:
        print(f"[ERROR] Failed to detect language for text '{text}': {e}")
        return 'Unknown'

# Function to validate and clean health condition
def clean_health_condition(value):
    if pd.isna(value) or value == 'Unknown' or value == 'Healthy':
        return 'general'
    return str(value).lower().replace(' ', '_')

# Validate dataset language and condition consistency
print("Validating dataset language and condition consistency...")
for intent in df['Intent'].unique():
    intent_rows = df[df['Intent'] == intent]
    languages = intent_rows['Language'].unique()
    print(f"\nIntent: {intent}")
    print(f"Available languages: {languages}")
    for lang in ['English', 'Sinhala']:
        if lang not in languages:
            print(f"WARNING: No {lang} response for intent '{intent}'")
        else:
            lang_rows = intent_rows[intent_rows['Language'] == lang]
            for index, row in lang_rows.iterrows():
                response = row['Response']
                health_condition = clean_health_condition(row.get('Health Condition', row.get('Condition', 'general')))
                response_lang = detect_language(response)
                intent_condition = intent.split('_for_')[-1] if '_for_' in intent else 'general'
                print(f"[DEBUG] Row {index}: Health Condition: {health_condition}, Intent Condition: {intent_condition}, Response: {response}, Detected Language: {response_lang}")
                if response_lang != lang:
                    print(f"ERROR: Language mismatch for intent '{intent}', Expected language: {lang}, Response language: {response_lang}, Response: {response}")
                if health_condition != intent_condition and intent_condition != 'general':
                    print(f"ERROR: Condition mismatch for intent '{intent}', Expected condition: {intent_condition}, Health Condition: {health_condition}, Response: {response}")

# Save validated dataset
df['Health Condition'] = df['Health Condition'].apply(clean_health_condition).fillna('general')
df['Condition'] = df['Condition'].apply(clean_health_condition).fillna('general')
df.to_csv('dataset_chatbot_validated.csv', index=False)
print("Validated dataset saved as 'dataset_chatbot_validated.csv'")