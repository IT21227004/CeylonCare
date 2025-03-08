import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import axios from "axios";

// Define Type for Navigation Params
type RootStackParamList = {
  TherapyDetails: { therapyName: string };
};

// Define Props for TherapyDetails
type TherapyDetailsScreenProps = {
  route: RouteProp<RootStackParamList, "TherapyDetails">;
};

// Define Type for Therapy Details Response
type TherapyDetailsResponse = {
  name: string;
  description: string;
  ar_pose: string;
  reference_video: string;
  steps: string[];
  benefits: string[];
  duration?: string;
};

// TherapyDetails Component
const TherapyDetails: React.FC<TherapyDetailsScreenProps> = ({ route }) => {
  const { therapyName } = route.params || { therapyName: "Default Therapy" };
  const [therapyDetails, setTherapyDetails] = useState<TherapyDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTherapyDetails();
  }, [therapyName]);

  // Fetch therapy details from API
  const fetchTherapyDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[DEBUG] Fetching details for therapy: ${therapyName}`);
  
      // Normalize therapy name to match Firestore (preserve exact case, handle spaces)
      const normalizedTherapyName = therapyName
        .trim()
        .replace(/%20/g, " ") // Replace URL-encoded spaces
        .replace(/-/g, " "); // Replace hyphens with spaces if needed

      console.log(`[DEBUG] Normalized therapy name for request: ${normalizedTherapyName}`);

      const response = await axios.get(
        `http://192.168.200.25:5000/therapy_details/${encodeURIComponent(normalizedTherapyName)}`
      );
  
      console.log("[DEBUG] API Response:", JSON.stringify(response.data, null, 2));
  
      if (!response.data) {
        throw new Error("Invalid API response: No therapy details found");
      }
  
      // Validate the response structure
      const data = response.data as TherapyDetailsResponse;
      if (!data.name || !data.description || !data.steps) {
        throw new Error("Invalid therapy details format");
      }
  
      setTherapyDetails(data);
    } catch (error) {
      console.error("[ERROR] Failed to fetch therapy details:", error);
      console.log("[DEBUG] Error details:", JSON.stringify(error.response?.data || error.message, null, 2));

      if (error.response && error.response.status === 404) {
        setError(`Therapy "${therapyName}" not found in the database.`);
        Alert.alert("Not Found", `Therapy "${therapyName}" not found in the database.`);
      } else {
        setError("Failed to load therapy details. Please try again.");
        Alert.alert("Error", "Failed to load therapy details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };  

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00BBD3" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {therapyDetails ? (
        <>
          <Text style={styles.title}>{therapyDetails.name}</Text>
          <Text style={styles.description}>{therapyDetails.description}</Text>
          {therapyDetails.duration && (
            <Text style={styles.duration}>Duration: {therapyDetails.duration}</Text>
          )}

          <Text style={styles.stepsTitle}>Steps to Follow:</Text>
          {therapyDetails.steps.map((step, index) => (
            <Text key={index} style={styles.stepItem}>
              {index + 1}. {step}
            </Text>
          ))}

          <Text style={styles.benefitsTitle}>Benefits:</Text>
          {therapyDetails.benefits.map((benefit, index) => (
            <Text key={index} style={styles.benefitItem}>
              {index + 1}. {benefit}
            </Text>
          ))}

          {therapyDetails.ar_pose && (
            <Text style={styles.arPose}>AR Pose: {therapyDetails.ar_pose}</Text>
          )}
          {therapyDetails.reference_video && (
            <Text style={styles.referenceVideo}>Reference Video: {therapyDetails.reference_video}</Text>
          )}
        </>
      ) : (
        <Text style={styles.errorText}>{error || "Therapy details not found."}</Text>
      )}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 10, color: "#00BBD3" },
  description: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 10 },
  duration: { fontSize: 16, textAlign: "center", fontWeight: "bold", marginBottom: 15, color: "#333" },
  stepsTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#00BBD3" },
  stepItem: { fontSize: 16, marginBottom: 5, color: "#333" },
  benefitsTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10, color: "#00BBD3" },
  benefitItem: { fontSize: 16, marginBottom: 5, color: "#333" },
  arPose: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 10 },
  referenceVideo: { fontSize: 16, textAlign: "center", color: "#666", marginBottom: 10 },
  errorText: { fontSize: 16, textAlign: "center", color: "red" },
});

export default TherapyDetails;