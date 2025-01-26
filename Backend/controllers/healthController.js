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
      res.status(200).json(healthSnapshot.data());
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

// Update or Add Health Data
const updateHealthData = async (req, res) => {
  const { userId } = req.params;
  const { gender, age, weight, height, exerciseFrequency, healthCondition } =
    req.body;

  console.log("[DEBUG] Updating health data for user:", userId);
  console.log("[DEBUG] Request Body:", req.body);

  try {
    const healthRef = doc(db, "healthData", userId);
    const data = {
      gender: gender || "",
      age: age || "",
      weight: weight || "",
      height: height || "",
      exerciseFrequency: exerciseFrequency || "",
      healthCondition: healthCondition || "",
    };

    await setDoc(healthRef, data, { merge: true });
    console.log("[DEBUG] Health data successfully updated for user:", userId);

    res.status(200).json({ message: "Health data updated successfully", data });
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

module.exports = {
  getHealthData,
  updateHealthData,
  deleteHealthData,
};
