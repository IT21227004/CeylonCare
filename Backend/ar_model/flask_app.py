from flask import Flask, request, jsonify
import pandas as pd
import joblib
import traceback
import firebase_admin
from firebase_admin import credentials, firestore
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Load Firebase credentials and initialize Firestore
try:
    cred = credentials.Certificate("./../firebaseConfig.js")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("[DEBUG] Firebase initialized successfully.")
except Exception as e:
    print(f"[ERROR] Firebase initialization failed: {e}")

# Load ML models
try:
    best_models = {
        "Therapy1": joblib.load("best_model_Decision Tree_Therapy1.joblib"),
        "Therapy2": joblib.load("best_model_Decision Tree_Therapy2.joblib"),
        "Therapy3": joblib.load("best_model_Decision Tree_Therapy3.joblib"),
    }
    print("[DEBUG] ML models loaded successfully.")
except FileNotFoundError as e:
    print(f"[ERROR] Model file not found: {e}")
except Exception as e:
    print(f"[ERROR] Error loading models: {e}")

# Load dataset for additional recommendations
try:
    dataset = pd.read_csv("cleaned_AR_dataset.csv")
    print("[DEBUG] Dataset loaded successfully.")
except FileNotFoundError:
    print("[ERROR] cleaned_AR_dataset.csv file not found.")
    dataset = pd.DataFrame()  # Fallback to empty dataset

# Define mappings for categorical features
gender_mapping = {'Female': 0, 'Male': 1}
health_condition_mapping = {'Diabetes': 0, 'Healthy': 1, 'Hypertension': 2, 'Pre-diabetes': 3}
exercise_frequency_mapping = {'Daily': 0, 'Rarely': 1, 'Weekly': 2}

@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict therapy based on user input (age, gender, health condition, etc.).
    """
    try:
        data = request.json
        print("[DEBUG] Received request data:", data)

        # Extract user data from request
        age = int(data.get("age", 0))
        gender = data.get("gender", "Male")
        health_condition = data.get("health_condition", "Healthy")
        weight = float(data.get("weight", 0))
        height = float(data.get("height", 1))  # Avoid division by zero
        exercise_frequency = data.get("exercise_frequency", "Daily")

        # Calculate BMI
        bmi = weight / ((height / 100) ** 2)
        print(f"[DEBUG] Calculated BMI: {bmi:.2f}")

        # Convert categorical values using mappings
        input_data = pd.DataFrame({
            "Age": [age],
            "Gender": [gender_mapping.get(gender, 1)],  # Default to Male (1) if not found
            "HealthCondition": [health_condition_mapping.get(health_condition, 1)],  # Default to Healthy (1)
            "BMI": [bmi],
            "ExerciseFrequency": [exercise_frequency_mapping.get(exercise_frequency, 1)]  # Default to Rarely (1)
        })

        print("[DEBUG] Prepared input data for prediction:", input_data)

        # Predict therapies using the models
        prediction_results = {}
        for therapy, model in best_models.items():
            try:
                prediction = model.predict(input_data)
                prediction_results[therapy] = prediction[0]
                print(f"[DEBUG] Prediction for {therapy}: {prediction[0]}")
            except Exception as e:
                print(f"[ERROR] Error predicting {therapy}: {e}")
                prediction_results[therapy] = "Error"

        # Generate additional therapy recommendations
        additional_therapies = generate_additional_therapies(
            dataset, prediction_results, health_condition, age, bmi
        )

        # Combine predictions and additional therapies
        all_recommendations = list(prediction_results.values()) + additional_therapies

        return jsonify({"recommendations": all_recommendations})

    except Exception as e:
        print("[ERROR] Error during prediction:", str(e))
        print(traceback.format_exc())  # Print detailed error traceback
        return jsonify({"error": "An error occurred while processing your request."})


def generate_additional_therapies(dataset, predictions, health_condition, age, bmi):
    """
    Generate additional therapy recommendations based on health condition, age, and BMI.
    """
    if dataset.empty:
        print("[ERROR] Dataset is empty. Additional therapies cannot be generated.")
        return []

    try:
        # Filter dataset based on user's health condition, age range, and BMI range
        filtered_data = dataset[
            (dataset['HealthCondition'] == health_condition) &
            (dataset['Age'].between(age - 5, age + 5)) &
            (dataset['BMI'].between(bmi - 2, bmi + 2))
        ]

        # Extract all unique therapy recommendations from the filtered dataset
        therapy_columns = ['Therapy1', 'Therapy2', 'Therapy3']
        all_therapies = pd.unique(filtered_data[therapy_columns].values.ravel())

        # Exclude already predicted therapies
        additional_therapies = [therapy for therapy in all_therapies if therapy not in predictions.values()]

        return additional_therapies[:5]  # Return at most 5 additional therapies

    except KeyError as e:
        print(f"[ERROR] Missing expected column in dataset: {e}")
        return []
    except Exception as e:
        print(f"[ERROR] Error during additional therapy generation: {e}")
        return []


if __name__ == "__main__":
    app.run(debug=True, port=5001)
