import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, LSTM, Embedding
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle

# Load Data
data_path = 'dataset_chatbot.csv'
data = pd.read_csv(data_path)

# Inspect Data
print("Initial Dataset Info:")
print(data.info())
print("\nSample Data:")
print(data.head())
print("\nUnique Intents:")
print(data['Intent'].unique())

# Drop duplicates
data.drop_duplicates(inplace=True)

# Handle Missing Values
data.replace('None', 'Healthy', inplace=True)
data.fillna('Unknown', inplace=True)

# Encode categorical labels
encoder = LabelEncoder()
data['Intent'] = encoder.fit_transform(data['Intent'])

# Save the Intent Label Encoder
with open('label_encoder.pkl', 'wb') as f:
    pickle.dump(encoder, f)

# Tokenization & Padding
MAX_NUM_WORDS = 5000
MAX_SEQ_LENGTH = 50

tokenizer = Tokenizer(num_words=MAX_NUM_WORDS, oov_token="<OOV>")
tokenizer.fit_on_texts(data['Query'])

X = tokenizer.texts_to_sequences(data['Query'])
X = pad_sequences(X, maxlen=MAX_SEQ_LENGTH)
y = np.array(data['Intent'], dtype=int)

# Save Tokenizer
with open('tokenizer.pkl', 'wb') as handle:
    pickle.dump(tokenizer, handle)

# Splitting Data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Save cleaned dataset
data.to_csv("cleaned_dataset.csv", index=False)

# Model Architecture
def create_model():
    model = Sequential([
        Embedding(MAX_NUM_WORDS, 128, input_length=MAX_SEQ_LENGTH),
        LSTM(64, return_sequences=True),
        LSTM(32),
        Dense(len(set(y)), activation='softmax')
    ])
    return model

# Train & Evaluate Model
model = create_model()
model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

history = model.fit(X_train, y_train, epochs=10, validation_data=(X_test, y_test), batch_size=32, verbose=1)

# Evaluate Model
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
y_pred = np.argmax(model.predict(X_test), axis=1)
accuracy = accuracy_score(y_test, y_pred)
print('Model Accuracy:', accuracy)
print('Confusion Matrix:\n', confusion_matrix(y_test, y_pred))
print('Classification Report:\n', classification_report(y_test, y_pred))

# Save Model in the recommended .keras format
model.save('best_chatbot_model.keras')  # Updated to .keras format

# Test Prediction
def chatbot_predict(query):
    with open('tokenizer.pkl', 'rb') as handle:
        tokenizer = pickle.load(handle)
    with open('label_encoder.pkl', 'rb') as f:
        label_encoder = pickle.load(f)

    # Load the model in the updated .keras format
    from tensorflow.keras.models import load_model
    model = load_model('best_chatbot_model.keras', compile=False)

    seq = tokenizer.texts_to_sequences([query])
    padded_seq = pad_sequences(seq, maxlen=50)
    prediction = np.argmax(model.predict(padded_seq), axis=1)
    predicted_intent = label_encoder.inverse_transform(prediction)[0]

    data = pd.read_csv('dataset_chatbot.csv')
    response = data[data['Intent'] == predicted_intent]['Response'].values
    return response[0] if len(response) > 0 else "Sorry, I don't understand your question."

# Test with health condition-specific queries
test_queries = [
    "How can I control my blood sugar naturally?",
    "මට අධි රුධිර පීඩනය පාලනය කරන්න උපදෙස් දෙන්න."
]
for query in test_queries:
    print(f"\nQuery: {query}")
    print(f"Response: {chatbot_predict(query)}")