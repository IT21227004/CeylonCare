const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;  // Make sure you're using .promises
const os = require('os');  // Add this line
const { v4: uuidv4 } = require('uuid');  // Add this line

class MLController {
  constructor() {
    this.pythonPath = 'python'; // or 'python3' depending on your system
    this.mlScriptPath = path.join(__dirname, '../ml_python');
    this.setupScript = path.join(this.mlScriptPath, 'train_ml.py');
    this.predictScript = path.join(this.mlScriptPath, 'predict.py');
    this.foodImageScript = path.join(this.mlScriptPath, 'predict_food_image.py');
  }

  // Initialize and train ML models
  async setupMLModels(req, res) {
    try {
      console.log('[DEBUG] Starting ML model setup...');
      
      const { categorizationFile, recipesFile } = req.body;
      
      if (!categorizationFile || !recipesFile) {
        return res.status(400).json({
          error: 'Both categorization and recipes files are required'
        });
      }

      // Check if files exist
      const categorizationPath = path.join(this.mlScriptPath, 'documents', categorizationFile);
      const recipesPath = path.join(this.mlScriptPath, 'documents', recipesFile);

      if (!fs.existsSync(categorizationPath) || !fs.existsSync(recipesPath)) {
        return res.status(400).json({
          error: 'Required DOCX files not found in ml_python/documents/ folder'
        });
      }

      // Run Python ML setup script
      const result = await this.runPythonScript(this.setupScript, [
        categorizationPath,
        recipesPath
      ]);

      if (result.success) {
        console.log('[DEBUG] ML models trained successfully');
        res.status(200).json({
          success: true,
          message: 'ML models trained successfully',
          data: result.data
        });
      } else {
        console.error('[ERROR] ML training failed:', result.error);
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('[ERROR] ML setup error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to setup ML models'
      });
    }
  }

  // Get food recommendations
  async getFoodRecommendations(req, res) {
    try {
      console.log('[DEBUG] Getting ML food recommendations...');
      
      const { userProfile, limit = 5 } = req.body;
      
      if (!userProfile) {
        return res.status(400).json({
          error: 'User profile is required'
        });
      }

      // Run Python prediction script
      const result = await this.runPythonScript(this.predictScript, [
        'recommend',
        JSON.stringify(userProfile),
        limit.toString()
      ]);

      if (result.success) {
        res.status(200).json({
          success: true,
          recommendations: result.data.recommendations,
          count: result.data.recommendations.length
        });
      } else {
        console.error('[ERROR] Recommendation failed:', result.error);
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('[ERROR] Recommendation error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get recommendations'
      });
    }
  }

  // Find similar foods
  async getSimilarFoods(req, res) {
    try {
      const { foodId } = req.params;
      const limit = parseInt(req.query.limit) || 5;

      console.log(`[DEBUG] Finding similar foods for food ID: ${foodId}`);

      const result = await this.runPythonScript(this.predictScript, [
        'similar',
        foodId,
        limit.toString()
      ]);

      if (result.success) {
        res.status(200).json({
          success: true,
          similar_foods: result.data.similar_foods,
          count: result.data.similar_foods.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('[ERROR] Similar foods error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to find similar foods'
      });
    }
  }

  // Generate meal plan
  async generateMealPlan(req, res) {
    try {
      console.log('[DEBUG] Generating ML meal plan...');
      
      const { userProfile, days = 7 } = req.body;

      if (!userProfile) {
        return res.status(400).json({
          error: 'User profile is required'
        });
      }

      const result = await this.runPythonScript(this.predictScript, [
        'meal_plan',
        JSON.stringify(userProfile),
        days.toString()
      ]);

      if (result.success) {
        res.status(200).json({
          success: true,
          meal_plan: result.data.meal_plan,
          days: result.data.meal_plan.length
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('[ERROR] Meal plan error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to generate meal plan'
      });
    }
  }

  // Analyze food image using the trained TensorFlow model
  async analyzeFoodImage(req, res) {
    let tempFilePath = null;
    
    try {
      console.log('[DEBUG] Analyzing food image with TensorFlow model...');
      
      const { imageData, foodHint = '' } = req.body;

      // Validate image data
      if (!imageData) {
        return res.status(400).json({
          success: false,
          error: 'Image data is required'
        });
      }

      // Check if image data is base64 encoded
      let base64Image = imageData;
      if (imageData.startsWith('data:image')) {
        // Extract base64 part from data URL
        base64Image = imageData.split(',')[1];
      }

      // Create a temporary file to store the base64 image data
      const tempDir = os.tmpdir();
      const tempFileName = `food_image_${uuidv4()}.txt`;
      tempFilePath = path.join(tempDir, tempFileName);
      
      // Write base64 data to temp file
      fs.writeFile(tempFilePath, base64Image);
      console.log('[DEBUG] Wrote image data to temp file:', tempFilePath);

      // Run the food image prediction script with temp file path
      const result = await this.runPythonScript(this.foodImageScript, [
        tempFilePath,
        foodHint
      ]);

      // Clean up temp file
      try {
        await fs.unlink(tempFilePath);
        console.log('[DEBUG] Cleaned up temp file');
      } catch (cleanupError) {
        console.error('[WARNING] Failed to clean up temp file:', cleanupError);
      }

      if (result.success) {
        console.log('[DEBUG] Food image analysis successful:', result.data.analysis.identifiedFood);
        res.status(200).json({
          success: true,
          analysis: result.data.analysis
        });
      } else {
        console.error('[ERROR] Food image analysis failed:', result.error);
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to analyze food image'
        });
      }
    } catch (error) {
      console.error('[ERROR] Food image analysis error:', error.message);
      
      // Clean up temp file in case of error
      if (tempFilePath) {
        try {
          fs.unlink(tempFilePath);
        } catch (cleanupError) {
          console.error('[WARNING] Failed to clean up temp file:', cleanupError);
        }
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error during image analysis'
      });
    }
  }

  // Get model information
  async getModelInfo(req, res) {
    try {
      console.log('[DEBUG] Getting ML model info...');

      // Check for food classification model
      const imageModelPath = path.join(__dirname, '../image_model/models/food_classifier_final.h5');
      const imageLabelsPath = path.join(__dirname, '../image_model/models/food_labels.json');
      const imageModelExists = fs.existsSync(imageModelPath);
      const imageLabelsExist = fs.existsSync(imageLabelsPath);

      // Get recommendation model info
      const result = await this.runPythonScript(this.predictScript, ['model_info']);

      const modelInfo = {
        recommendation_models: result.success ? result.data.model_info : { status: 'Not available' },
        food_classification_model: {
          status: imageModelExists ? 'Available' : 'Not trained',
          model_path: imageModelPath,
          labels_available: imageLabelsExist,
          model_type: 'TensorFlow/Keras - MobileNetV2 Transfer Learning'
        }
      };

      res.status(200).json({
        success: true,
        model_info: modelInfo
      });
    } catch (error) {
      console.error('[ERROR] Model info error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get model info'
      });
    }
  }

  // Helper method to run Python scripts
  runPythonScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
      console.log(`[DEBUG] Running Python script: ${scriptPath} with args:`, args);
      
      const python = spawn(this.pythonPath, [scriptPath, ...args], {
        cwd: this.mlScriptPath
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve({
              success: true,
              data: result
            });
          } catch (parseError) {
            console.error('[ERROR] Failed to parse Python output:', stdout);
            resolve({
              success: false,
              error: 'Invalid response from ML script'
            });
          }
        } else {
          console.error('[ERROR] Python script failed with code:', code);
          console.error('[ERROR] Error output:', stderr);
          resolve({
            success: false,
            error: stderr || `Python script exited with code ${code}`
          });
        }
      });

      python.on('error', (error) => {
        console.error('[ERROR] Failed to start Python script:', error);
        reject(error);
      });
    });
  }

  // Health check for ML system
  async healthCheck(req, res) {
    try {
      const modelsDir = path.join(this.mlScriptPath, 'ml_models');
      const dataDir = path.join(this.mlScriptPath, 'ml_data');
      const imageModelDir = path.join(__dirname, '../image_model/models');

      // Check recommendation models
      const contentModelExists = fs.existsSync(path.join(modelsDir, 'content_based_model.h5'));
      const clusteringModelExists = fs.existsSync(path.join(modelsDir, 'kmeans.pkl'));
      const healthClfExists = fs.existsSync(path.join(modelsDir, 'rf_health.pkl'));

      // Check food classification model
      const foodModelExists = fs.existsSync(path.join(imageModelDir, 'food_classifier_final.h5'));
      const foodLabelsExist = fs.existsSync(path.join(imageModelDir, 'food_labels.json'));

      res.status(200).json({
        success: true,
        status: 'healthy',
        ml_system: {
          directories_exist: fs.existsSync(modelsDir) && fs.existsSync(dataDir),
          recommendation_models_trained: contentModelExists && clusteringModelExists && healthClfExists,
          food_classification_model_trained: foodModelExists && foodLabelsExist,
          python_available: true,
          models: {
            content_based: contentModelExists,
            clustering: clusteringModelExists,
            health_classifier: healthClfExists,
            food_image_classifier: foodModelExists,
            food_labels: foodLabelsExist
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'ML health check failed'
      });
    }
  }
}

module.exports = new MLController();