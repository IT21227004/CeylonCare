const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class MLController {
  constructor() {
    this.pythonPath = 'python'; // or 'python3' depending on your system
    this.mlScriptPath = path.join(__dirname, '../ml_python');
    this.setupScript  = path.join(this.mlScriptPath, 'train_ml.py');
    this.predictScript = path.join(this.mlScriptPath, 'predict.py');
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

  // Analyze food image
  async analyzeFoodImage(req, res) {
    try {
      console.log('[DEBUG] Analyzing food image...');
      
      const { foodHint } = req.body;

      const result = await this.runPythonScript(this.predictScript, [
        'analyze_image',
        foodHint || ''
      ]);

      if (result.success) {
        res.status(200).json({
          success: true,
          analysis: result.data.analysis
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('[ERROR] Image analysis error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze food image'
      });
    }
  }

  // Get model information
  async getModelInfo(req, res) {
    try {
      console.log('[DEBUG] Getting ML model info...');

      const result = await this.runPythonScript(this.predictScript, ['model_info']);

      if (result.success) {
        res.status(200).json({
          success: true,
          model_info: result.data.model_info
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }
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
          console.error('[ERROR] Python script failed:', stderr);
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
      const dataDir   = path.join(this.mlScriptPath, 'ml_data');

      // Check for the three files we actually create:
      const contentModelExists    = fs.existsSync(path.join(modelsDir, 'content_based_model.h5'));
      const clusteringModelExists = fs.existsSync(path.join(modelsDir, 'kmeans.pkl'));
      const healthClfExists       = fs.existsSync(path.join(modelsDir, 'rf_health.pkl'));

      res.status(200).json({
        success: true,
        status: 'healthy',
        ml_system: {
          directories_exist: fs.existsSync(modelsDir) && fs.existsSync(dataDir),
          models_trained:    contentModelExists && clusteringModelExists && healthClfExists,
          python_available:  true
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