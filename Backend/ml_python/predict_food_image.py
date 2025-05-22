"""
CeylonCare Food Image Classification Prediction Script
======================================================

This script handles food image classification using the trained TensorFlow model.
It integrates with the Node.js backend through the ML controller.

Usage:
    python predict_food_image.py <temp_file_path> [food_hint]

Author: CeylonCare Team
"""

import sys
import json
import os
import numpy as np
from PIL import Image
import tensorflow as tf
import base64
import io
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MODEL_PATH = '../image_model/models/food_classifier_final.h5'
LABELS_PATH = '../image_model/models/food_labels.json'
IMG_SIZE = 224

# Global variables
model = None
food_labels = None
class_names = None

def load_model_and_labels():
    """Load the trained model and class labels"""
    global model, food_labels, class_names
    
    try:
        # Get absolute paths
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(script_dir, MODEL_PATH)
        labels_path = os.path.join(script_dir, LABELS_PATH)
        
        # Load the trained model
        logger.info(f"Loading model from {model_path}")
        model = tf.keras.models.load_model(model_path)
        logger.info("✅ Model loaded successfully")
        
        # Load class labels
        logger.info(f"Loading labels from {labels_path}")
        with open(labels_path, 'r') as f:
            food_labels = json.load(f)
        
        # Convert to class names list (index -> name)
        class_names = [food_labels[str(i)] for i in range(len(food_labels))]
        logger.info(f"✅ Loaded {len(class_names)} food classes")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error loading model or labels: {e}")
        return False

def read_image_from_file(file_path):
    """Read base64 image data from temp file"""
    try:
        with open(file_path, 'r') as f:
            base64_data = f.read().strip()
        return base64_data
    except Exception as e:
        logger.error(f"Error reading temp file: {e}")
        raise

def preprocess_image(image_data):
    """Preprocess image for model prediction"""
    try:
        # Decode base64 image
        if isinstance(image_data, str):
            # Remove data URL prefix if present
            if 'data:image' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
        else:
            image = image_data
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize to model input size
        image = image.resize((IMG_SIZE, IMG_SIZE))
        
        # Convert to numpy array and normalize
        img_array = np.array(image).astype(np.float32)
        img_array = img_array / 255.0  # Normalize to [0,1]
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
        
    except Exception as e:
        logger.error(f"Error preprocessing image: {e}")
        raise

def get_nutritional_info(food_name):
    """Get nutritional information for the identified food"""
    nutrition_db = {
        'rice_and_curry': {
            'calories': '450',
            'protein': '15g',
            'carbs': '75g',
            'fat': '12g',
            'fiber': '8g'
        },
        'kottu': {
            'calories': '520',
            'protein': '18g', 
            'carbs': '65g',
            'fat': '20g',
            'fiber': '5g'
        },
        'hoppers': {
            'calories': '180',
            'protein': '6g',
            'carbs': '28g',
            'fat': '5g',
            'fiber': '3g'
        },
        'string_hoppers': {
            'calories': '200',
            'protein': '5g',
            'carbs': '40g',
            'fat': '3g',
            'fiber': '2g'
        },
        'dhal_curry': {
            'calories': '250',
            'protein': '12g',
            'carbs': '35g',
            'fat': '8g',
            'fiber': '10g'
        },
        'roti': {
            'calories': '280',
            'protein': '8g',
            'carbs': '45g',
            'fat': '7g',
            'fiber': '4g'
        },
        'coconut_sambol': {
            'calories': '120',
            'protein': '2g',
            'carbs': '8g',
            'fat': '10g',
            'fiber': '3g'
        },
        'fish_curry': {
            'calories': '320',
            'protein': '25g',
            'carbs': '15g',
            'fat': '18g',
            'fiber': '2g'
        },
        'chicken_curry': {
            'calories': '380',
            'protein': '28g',
            'carbs': '12g',
            'fat': '25g',
            'fiber': '3g'
        },
        'vegetable_curry': {
            'calories': '150',
            'protein': '5g',
            'carbs': '20g',
            'fat': '6g',
            'fiber': '7g'
        }
    }
    
    # Default nutritional info
    default_nutrition = {
        'calories': '300',
        'protein': '10g',
        'carbs': '45g',
        'fat': '8g',
        'fiber': '5g'
    }
    
    return nutrition_db.get(food_name.lower().replace(' ', '_'), default_nutrition)

def get_health_benefits(food_name):
    """Get health benefits for the identified food"""
    benefits_db = {
        'rice_and_curry': [
            'Rich in carbohydrates for sustained energy',
            'Contains diverse vegetables providing vitamins',
            'Spices have anti-inflammatory properties',
            'Good source of fiber from vegetables'
        ],
        'kottu': [
            'High protein content from meat/eggs',
            'Contains vegetables providing nutrients',
            'Good source of energy from carbohydrates',
            'Spices aid digestion and metabolism'
        ],
        'hoppers': [
            'Fermented rice provides beneficial probiotics',
            'Light and easily digestible',
            'Contains coconut which provides healthy fats',
            'Traditional fermentation supports gut health'
        ],
        'string_hoppers': [
            'Light and low in calories',
            'Easy to digest and gentle on stomach',
            'Good base for nutritious curries',
            'Contains rice which provides quick energy'
        ],
        'dhal_curry': [
            'Excellent source of plant-based protein',
            'Rich in fiber for digestive health',
            'Contains folate, iron, and potassium',
            'Turmeric has powerful anti-inflammatory properties'
        ],
        'roti': [
            'Good source of carbohydrates for energy',
            'Contains fiber if made with whole wheat',
            'Provides B vitamins from wheat',
            'Pairs well with protein-rich curries'
        ],
        'coconut_sambol': [
            'Contains healthy medium-chain fatty acids',
            'Rich in fiber from coconut',
            'Chilies contain vitamin C and capsaicin',
            'Onions provide antioxidants'
        ],
        'fish_curry': [
            'Excellent source of omega-3 fatty acids',
            'High-quality complete protein',
            'Rich in vitamin D and B12',
            'Spices provide anti-inflammatory benefits'
        ],
        'chicken_curry': [
            'High-quality complete protein source',
            'Rich in B vitamins and selenium',
            'Contains iron and zinc',
            'Spices aid digestion and immunity'
        ],
        'vegetable_curry': [
            'Rich in vitamins, minerals, and antioxidants',
            'High fiber content for digestive health',
            'Low in calories, high in nutrients',
            'Provides phytonutrients for disease prevention'
        ]
    }
    
    default_benefits = [
        'Part of traditional Sri Lankan cuisine',
        'Contains spices with health benefits',
        'Provides essential nutrients',
        'Culturally significant and wholesome food'
    ]
    
    return benefits_db.get(food_name.lower().replace(' ', '_'), default_benefits)

def calculate_health_score(food_name, nutritional_info):
    """Calculate a health score based on the food and its nutrition"""
    # Base scores for different Sri Lankan foods
    base_scores = {
        'dhal_curry': 85,
        'vegetable_curry': 90,
        'fish_curry': 80,
        'rice_and_curry': 75,
        'string_hoppers': 70,
        'hoppers': 65,
        'chicken_curry': 70,
        'roti': 65,
        'coconut_sambol': 60,
        'kottu': 55
    }
    
    base_score = base_scores.get(food_name.lower().replace(' ', '_'), 70)
    
    # Adjust based on nutritional content
    try:
        calories = int(nutritional_info['calories'])
        protein = int(nutritional_info['protein'].replace('g', ''))
        fiber = int(nutritional_info['fiber'].replace('g', ''))
        
        # Bonus for high protein and fiber
        if protein >= 20:
            base_score += 5
        if fiber >= 7:
            base_score += 5
            
        # Penalty for very high calories
        if calories > 500:
            base_score -= 10
        elif calories < 250:
            base_score += 5
            
    except:
        pass
    
    return max(30, min(95, base_score))  # Clamp between 30-95

def get_suggestions(food_name, health_score):
    """Get health suggestions based on the food and health score"""
    if health_score >= 80:
        return [
            "Excellent choice! This is a very nutritious meal.",
            "Consider adding more vegetables for extra nutrients.",
            "Maintain proper portion sizes for optimal health.",
            "This food provides great nutritional value."
        ]
    elif health_score >= 65:
        return [
            "Good choice with balanced nutrition.",
            "Try to add more vegetables on the side.",
            "Consider using less oil in preparation.",
            "Pair with a fresh salad for extra nutrients."
        ]
    else:
        return [
            "Consider this as an occasional treat.",
            "Balance with more vegetables and lean proteins.",
            "Try healthier cooking methods like steaming or grilling.",
            "Consider smaller portions and add nutritious sides."
        ]

def predict_food_image(image_data, food_hint=""):
    """Main function to predict food from image"""
    try:
        # Load model if not already loaded
        if model is None:
            if not load_model_and_labels():
                raise Exception("Failed to load model and labels")
        
        # Preprocess the image
        processed_image = preprocess_image(image_data)
        
        # Make prediction
        predictions = model.predict(processed_image, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx])
        
        # Get the predicted food name
        predicted_food = class_names[predicted_class_idx]
        
        # Get top 3 predictions for additional context
        top_3_indices = np.argsort(predictions[0])[-3:][::-1]
        top_3_predictions = [
            {
                'food': class_names[idx],
                'confidence': float(predictions[0][idx])
            }
            for idx in top_3_indices
        ]
        
        # Get nutritional information
        nutritional_info = get_nutritional_info(predicted_food)
        
        # Get health benefits
        health_benefits = get_health_benefits(predicted_food)
        
        # Calculate health score
        health_score = calculate_health_score(predicted_food, nutritional_info)
        
        # Get suggestions
        suggestions = get_suggestions(predicted_food, health_score)
        
        # Prepare the response
        result = {
            'success': True,
            'analysis': {
                'identifiedFood': predicted_food,
                'confidence': confidence,
                'healthScore': health_score,
                'nutritionalValue': nutritional_info,
                'healthBenefits': health_benefits,
                'suggestions': suggestions,
                'topPredictions': top_3_predictions,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error in food prediction: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Main function for command line usage"""
    try:
        if len(sys.argv) < 2:
            raise ValueError("Temp file path is required")
        
        temp_file_path = sys.argv[1]
        food_hint = sys.argv[2] if len(sys.argv) > 2 else ""
        
        # Read image data from temp file
        image_data = read_image_from_file(temp_file_path)
        
        # Make prediction
        result = predict_food_image(image_data, food_hint)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()