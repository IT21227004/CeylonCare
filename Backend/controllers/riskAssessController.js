const { doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, where } = require("firebase/firestore");
const { db } = require("../firebaseConfig");

// Get Risk Assessment Data by ID
const getRiskAssessmentById = async (req, res) => {
  const { id } = req.params;
  console.log("[DEBUG] Fetching risk assessment data by ID:", id);

  try {
    const riskAssessRef = doc(db, "riskAssessments", id);
    const riskAssessSnapshot = await getDoc(riskAssessRef);

    if (riskAssessSnapshot.exists()) {
      console.log("[DEBUG] Risk assessment data found for ID:", id);
      res.status(200).json(riskAssessSnapshot.data());
    } else {
      console.log("[DEBUG] No risk assessment data found for ID:", id);
      res.status(404).json({ error: "Risk assessment data not found" });
    }
  } catch (error) {
    console.error(
      "[ERROR] Error fetching risk assessment data for ID:",
      id,
      error.message
    );
    res.status(500).json({ error: "Failed to fetch risk assessment data" });
  }
};

// Get Risk Assessment Data by User ID
const getRiskAssessmentByUserId = async (req, res) => {
  const { userId } = req.params;
  console.log("[DEBUG] Fetching risk assessment data for user:", userId);

  try {
    const riskAssessQuery = query(
      collection(db, "riskAssessments"),
      where("userId", "==", userId)
    );
    const riskAssessSnapshot = await getDocs(riskAssessQuery);

    if (!riskAssessSnapshot.empty) {
      const riskAssessments = [];
      riskAssessSnapshot.forEach((doc) => {
        riskAssessments.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      console.log("[DEBUG] Risk assessment data found for user:", userId);
      res.status(200).json(riskAssessments);
    } else {
      console.log("[DEBUG] No risk assessment data found for user:", userId);
      res.status(200).json([]); // Return empty array for users with no assessments
    }
  } catch (error) {
    console.error(
      "[ERROR] Error fetching risk assessment data for user:",
      userId,
      error.message
    );
    res.status(500).json({ error: "Failed to fetch risk assessment data" });
  }
};

// Get All Risk Assessments
const getAllRiskAssessments = async (req, res) => {
  console.log("[DEBUG] Fetching all risk assessment data");

  try {
    const riskAssessSnapshot = await getDocs(collection(db, "riskAssessments"));
    const riskAssessments = [];
    
    riskAssessSnapshot.forEach((doc) => {
      riskAssessments.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    console.log("[DEBUG] Successfully fetched all risk assessment data");
    res.status(200).json(riskAssessments);
  } catch (error) {
    console.error(
      "[ERROR] Error fetching all risk assessment data:",
      error.message
    );
    res.status(500).json({ error: "Failed to fetch risk assessment data" });
  }
};

// Create Risk Assessment
const createRiskAssessment = async (req, res) => {
  console.log("[DEBUG] Creating new risk assessment");
  console.log("[DEBUG] Request Body:", req.body);

  try {
    const {
      userId,
      username,
      age,
      weight,
      height,
      bmi,
      gender,
      heartDisease,
      avgGlucoseLevel,
      bloodGlucoseLevel,
      hba1cLevel,
      smokingStatus,
      workType,
      residenceType,
      hypertension,
      diabetes
    } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Generate a unique ID for the risk assessment
    const riskAssessId = `risk_${userId}_${Date.now()}`;
    const riskAssessRef = doc(db, "riskAssessments", riskAssessId);

    // Calculate risk levels
    let diabetesRiskLevel = "0";
    let hypertensionRiskLevel = "0";

    // Diabetes risk calculation - only if diabetes is 0 (no diabetes)
    if (diabetes === "0") {
      let riskScore = 0;
      
      if (parseFloat(hba1cLevel) >= 6.5) {
        diabetesRiskLevel = "high";
      } else if (parseFloat(hba1cLevel) >= 5.7) {
        diabetesRiskLevel = "medium";
      }
      
      if (parseFloat(bloodGlucoseLevel) >= 7.0) {
        diabetesRiskLevel = "high";
      } else if (parseFloat(bloodGlucoseLevel) >= 5.6) {
        diabetesRiskLevel = "medium";
      }
      
      if (diabetesRiskLevel === "0") {
        if (parseFloat(age) > 60) riskScore++;
        if (hypertension === "1") riskScore++;
        if (heartDisease === "1") riskScore++;
        if (smokingStatus === "formerly smoked") riskScore++;
        if (smokingStatus === "smokes") riskScore += 2;
        if (parseFloat(bmi) > 25) riskScore += 2;
        if (parseFloat(bmi) > 30) riskScore += 3;
        
        if (riskScore >= 5) diabetesRiskLevel = "high";
        else if (riskScore >= 3) diabetesRiskLevel = "medium";
        else if (riskScore > 0) diabetesRiskLevel = "low";
      }
    }

    // Hypertension risk calculation - only if hypertension is 0 (no hypertension)
    if (hypertension === "0") {
      if (smokingStatus === "smokes") {
        hypertensionRiskLevel = "high";
      } else if (parseFloat(age) > 65) {
        hypertensionRiskLevel = "medium";
      } else if (heartDisease === "1") {
        hypertensionRiskLevel = "high";
      } else if (hypertensionRiskLevel === "0" && (parseFloat(age) > 50 || parseFloat(bmi) > 30)) {
        hypertensionRiskLevel = "low";
      }
    }

    const data = {
      userId,
      username: username || "",
      age: age || "",
      weight: weight || "",
      height: height || "",
      bmi: bmi || "",
      gender: gender || "",
      heartDisease: heartDisease || "0",
      avgGlucoseLevel: avgGlucoseLevel || "",
      bloodGlucoseLevel: bloodGlucoseLevel || "",
      hba1cLevel: hba1cLevel || "",
      smokingStatus: smokingStatus || "never smoked",
      workType: workType || "",
      residenceType: residenceType || "",
      hypertension: hypertension || "0",
      diabetes: diabetes || "0",
      diabetes_risk: diabetesRiskLevel,
      hypertension_risk: hypertensionRiskLevel,
      createdAt: new Date().toISOString(),
    };

    await setDoc(riskAssessRef, data);
    console.log("[DEBUG] Risk assessment successfully created with ID:", riskAssessId);

    res.status(201).json({ 
      message: "Risk assessment created successfully", 
      id: riskAssessId,
      data 
    });
  } catch (error) {
    console.error(
      "[ERROR] Error creating risk assessment:",
      error.message
    );
    res.status(500).json({ error: "Failed to create risk assessment" });
  }
}

// Update Risk Assessment
const updateRiskAssessment = async (req, res) => {
  const { id } = req.params;
  console.log("[DEBUG] Updating risk assessment with ID:", id);
  console.log("[DEBUG] Request Body:", req.body);

  try {
    const riskAssessRef = doc(db, "riskAssessments", id);
    const riskAssessSnapshot = await getDoc(riskAssessRef);

    if (!riskAssessSnapshot.exists()) {
      console.log("[DEBUG] Risk assessment not found with ID:", id);
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    const {
      username,
      age,
      weight,
      height,
      bmi,
      gender,
      heartDisease,
      avgGlucoseLevel,
      bloodGlucoseLevel,
      hba1cLevel,
      smokingStatus,
      workType,
      residenceType,
      hypertension,
      diabetes
    } = req.body;

    // Calculate risk levels
    let diabetesRiskLevel = "0";
    let hypertensionRiskLevel = "0";

    // Diabetes risk calculation - only if diabetes is 0 (no diabetes)
    if (diabetes === "0") {
      let riskScore = 0;
      
      if (parseFloat(hba1cLevel) >= 6.5) {
        diabetesRiskLevel = "high";
      } else if (parseFloat(hba1cLevel) >= 5.7) {
        diabetesRiskLevel = "medium";
      }
      
      if (parseFloat(bloodGlucoseLevel) >= 7.0) {
        diabetesRiskLevel = "high";
      } else if (parseFloat(bloodGlucoseLevel) >= 5.6) {
        diabetesRiskLevel = "medium";
      }
      
      if (diabetesRiskLevel === "0") {
        if (parseFloat(age) > 60) riskScore++;
        if (hypertension === "1") riskScore++;
        if (heartDisease === "1") riskScore++;
        if (smokingStatus === "formerly smoked") riskScore++;
        if (smokingStatus === "smokes") riskScore += 2;
        if (parseFloat(bmi) > 25) riskScore += 2;
        if (parseFloat(bmi) > 30) riskScore += 3;
        
        if (riskScore >= 5) diabetesRiskLevel = "high";
        else if (riskScore >= 3) diabetesRiskLevel = "medium";
        else if (riskScore > 0) diabetesRiskLevel = "low";
      }
    }

    // Hypertension risk calculation - only if hypertension is 0 (no hypertension)
    if (hypertension === "0") {
      if (smokingStatus === "smokes") {
        hypertensionRiskLevel = "high";
      } else if (parseFloat(age) > 65) {
        hypertensionRiskLevel = "medium";
      } else if (heartDisease === "1") {
        hypertensionRiskLevel = "high";
      } else if (hypertensionRiskLevel === "0" && (parseFloat(age) > 50 || parseFloat(bmi) > 30)) {
        hypertensionRiskLevel = "low";
      }
    }

    const data = {
      username: username || riskAssessSnapshot.data().username,
      age: age || riskAssessSnapshot.data().age,
      weight: weight || riskAssessSnapshot.data().weight,
      height: height || riskAssessSnapshot.data().height,
      bmi: bmi || riskAssessSnapshot.data().bmi,
      gender: gender || riskAssessSnapshot.data().gender,
      heartDisease: heartDisease || riskAssessSnapshot.data().heartDisease,
      avgGlucoseLevel: avgGlucoseLevel || riskAssessSnapshot.data().avgGlucoseLevel,
      bloodGlucoseLevel: bloodGlucoseLevel || riskAssessSnapshot.data().bloodGlucoseLevel,
      hba1cLevel: hba1cLevel || riskAssessSnapshot.data().hba1cLevel,
      smokingStatus: smokingStatus || riskAssessSnapshot.data().smokingStatus,
      workType: workType || riskAssessSnapshot.data().workType,
      residenceType: residenceType || riskAssessSnapshot.data().residenceType,
      hypertension: hypertension || riskAssessSnapshot.data().hypertension,
      diabetes: diabetes || riskAssessSnapshot.data().diabetes || "0",
      diabetes_risk: diabetesRiskLevel,
      hypertension_risk: hypertensionRiskLevel,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(riskAssessRef, data, { merge: true });
    console.log("[DEBUG] Risk assessment successfully updated with ID:", id);

    res.status(200).json({ 
      message: "Risk assessment updated successfully", 
      data 
    });
  } catch (error) {
    console.error(
      "[ERROR] Error updating risk assessment:",
      id,
      error.message
    );
    res.status(500).json({ error: "Failed to update risk assessment" });
  }
};

// Delete Risk Assessment
const deleteRiskAssessment = async (req, res) => {
  const { id } = req.params;
  console.log("[DEBUG] Deleting risk assessment with ID:", id);

  try {
    const riskAssessRef = doc(db, "riskAssessments", id);
    const riskAssessSnapshot = await getDoc(riskAssessRef);

    if (!riskAssessSnapshot.exists()) {
      console.log("[DEBUG] Risk assessment not found with ID:", id);
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    await deleteDoc(riskAssessRef);
    console.log("[DEBUG] Risk assessment successfully deleted with ID:", id);
    
    res.status(200).json({ message: "Risk assessment deleted successfully" });
  } catch (error) {
    console.error(
      "[ERROR] Error deleting risk assessment:",
      id,
      error.message
    );
    res.status(500).json({ error: "Failed to delete risk assessment" });
  }
};

module.exports = {
  getRiskAssessmentById,
  getRiskAssessmentByUserId,
  getAllRiskAssessments,
  createRiskAssessment,
  updateRiskAssessment,
  deleteRiskAssessment,
};
