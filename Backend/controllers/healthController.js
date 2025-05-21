const { doc, setDoc, getDoc, deleteDoc } = require("firebase/firestore");
const { db } = require("../firebaseConfig");

// Get Health Data
const getHealthData = async (req, res) => {
  const { userId } = req.params;
  console.log("[DEBUG] Fetching health data for user:", userId);

  try {
    const healthRef = doc(db, "healthData", userId);
    const healthSnapshot = await getDoc(healthRef);

    if (healthSnapshot.exists()) {
      console.log("[DEBUG] Health data found for user:", userId);
      const data = healthSnapshot.data();
      
      // Ensure all expected fields are present
      const completeData = {
        gender: data.gender || "",
        age: data.age || "",
        weight: data.weight || "",
        height: data.height || "",
        exerciseFrequency: data.exerciseFrequency || "",
        healthCondition: data.healthCondition || "",
        medicalConditions: data.medicalConditions || [],
        allergies: data.allergies || "",
        dietaryPreferences: data.dietaryPreferences || "",
        // Legacy fields for compatibility
        ...data
      };

      res.status(200).json(completeData);
    } else {
      console.log("[DEBUG] No health data found for user:", userId);
      res.status(200).json({}); // Return empty object for new users
    }
  } catch (error) {
    console.error(
      "[ERROR] Error fetching health data for user:",
      userId,
      error.message
    );
    res.status(500).json({ error: "Failed to fetch health data" });
  }
};

// Update and Add Health Data
const updateHealthData = async (req, res) => {
  const { userId } = req.params;
  const { 
    gender, 
    age, 
    weight, 
    height, 
    exerciseFrequency, 
    healthCondition,
    medicalConditions,
    allergies,
    dietaryPreferences
  } = req.body;

  console.log("[DEBUG] Updating health data for user:", userId);
  console.log("[DEBUG] Request Body:", req.body);

  try {
    const healthRef = doc(db, "healthData", userId);
    
    // Prepare data with all fields
    const data = {
      gender: gender || "",
      age: age || "",
      weight: weight || "",
      height: height || "",
      exerciseFrequency: exerciseFrequency || "",
      healthCondition: healthCondition || "",
      medicalConditions: medicalConditions || [],
      allergies: allergies || "",
      dietaryPreferences: dietaryPreferences || "",
      updatedAt: new Date().toISOString(),
    };

    // If medicalConditions array exists but healthCondition is empty, 
    // create healthCondition from medicalConditions for compatibility
    if (medicalConditions && medicalConditions.length > 0 && !healthCondition) {
      data.healthCondition = medicalConditions.join(', ');
    }

    await setDoc(healthRef, data, { merge: true });
    console.log("[DEBUG] Health data successfully updated for user:", userId);
    console.log("[DEBUG] Saved data:", data);

    res.status(200).json({ 
      message: "Health data updated successfully", 
      data 
    });
  } catch (error) {
    console.error(
      "[ERROR] Error updating health data for user:",
      userId,
      error.message
    );
    res.status(500).json({ error: "Failed to update health data" });
  }
};

// Delete Health Data
const deleteHealthData = async (req, res) => {
  const { userId } = req.params;
  console.log("[DEBUG] Deleting health data for user:", userId);

  try {
    const healthRef = doc(db, "healthData", userId);
    await deleteDoc(healthRef);

    console.log("[DEBUG] Health data successfully deleted for user:", userId);
    res.status(200).json({ message: "Health data deleted successfully" });
  } catch (error) {
    console.error(
      "[ERROR] Error deleting health data for user:",
      userId,
      error.message
    );
    res.status(500).json({ error: "Failed to delete health data" });
  }
};

// Additional helper function to get health data for ML recommendations
const getHealthDataForRecommendations = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const healthRef = doc(db, "healthData", userId);
    const healthSnapshot = await getDoc(healthRef);

    if (healthSnapshot.exists()) {
      const data = healthSnapshot.data();
      
      // Format data specifically for ML model consumption
      const mlFormattedData = {
        age: parseInt(data.age) || 0,
        weight: parseFloat(data.weight) || 0,
        height: parseFloat(data.height) || 0,
        gender: data.gender || "",
        medicalConditions: data.medicalConditions || [],
        exerciseFrequency: data.exerciseFrequency || "",
        allergies: data.allergies ? data.allergies.split(',').map(item => item.trim()) : [],
        dietaryPreferences: data.dietaryPreferences || "",
        bmi: calculateBMI(data.weight, data.height)
      };

      res.status(200).json(mlFormattedData);
    } else {
      res.status(404).json({ error: "No health data found for user" });
    }
  } catch (error) {
    console.error("[ERROR] Error fetching health data for ML:", error.message);
    res.status(500).json({ error: "Failed to fetch health data for recommendations" });
  }
};

// Helper function to calculate BMI
const calculateBMI = (weight, height) => {
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  
  if (weightNum && heightNum) {
    const heightInMeters = heightNum / 100;
    return Math.round((weightNum / (heightInMeters * heightInMeters)) * 10) / 10;
  }
  return 0;
};

module.exports = {
  getHealthData,
  updateHealthData,
  deleteHealthData,
  getHealthDataForRecommendations,
};