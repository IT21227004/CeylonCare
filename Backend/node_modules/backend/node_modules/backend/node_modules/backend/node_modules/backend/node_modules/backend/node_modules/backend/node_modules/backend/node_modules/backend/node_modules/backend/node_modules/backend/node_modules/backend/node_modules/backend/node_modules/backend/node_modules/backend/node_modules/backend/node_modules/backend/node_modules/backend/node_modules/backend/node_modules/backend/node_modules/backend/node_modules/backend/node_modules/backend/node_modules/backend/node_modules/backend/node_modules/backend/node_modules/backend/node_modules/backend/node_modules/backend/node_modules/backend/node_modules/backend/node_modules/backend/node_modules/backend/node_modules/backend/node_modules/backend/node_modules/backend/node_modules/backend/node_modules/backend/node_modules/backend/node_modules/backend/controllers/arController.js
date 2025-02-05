const axios = require("axios");

// Therapy Recommendation API
const getARRecommendations = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    console.error("[ERROR] No userId provided in request.");
    return res.status(400).json({ error: "User ID is required" });
  }

  console.log("[DEBUG] Received request to fetch therapy for user:", userId);

  try {
    // Fetch user's health data from Firestore
    const response = await fetch(`http://localhost:5000/healthData/${userId}`);

    console.log("[DEBUG] Fetching health data for user:", userId);
    console.log("[DEBUG] Response status:", response.status);

    if (!response.ok) throw new Error(`Error fetching health data: ${response.statusText}`);

    const userHealthData = await response.json();
    console.log("[DEBUG] Fetched user health data:", userHealthData);

    const flaskResponse = await axios.post("http://localhost:5001/predict", userHealthData);

    console.log("[DEBUG] Flask API Full Response:", JSON.stringify(flaskResponse.data, null, 2));

    if (!flaskResponse.data || !flaskResponse.data.recommendations) {
      console.error("[ERROR] Flask response does not contain recommendations.");
      return res.status(500).json({ error: "Invalid response from Flask API" });
    }

    res.status(200).json({ recommendations: flaskResponse.data.recommendations });

  } catch (error) {
    console.error("[ERROR] Failed to fetch therapy recommendations:", error.message);
    res.status(500).json({ error: "Failed to fetch therapy recommendations" });
  }
};

module.exports = { getARRecommendations };
