import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { StackNavigationProp } from "@react-navigation/stack";

// Define TypeScript props for navigation
type RootStackParamList = {
  TherapyRecommendations: undefined;
  TherapyDetails: { therapyName: string };
};

type TherapyRecommendationsProps = {
  navigation: StackNavigationProp<RootStackParamList, "TherapyRecommendations">;
};

// Define Type for Therapy Item
type TherapyItem = string;

// TherapyRecommendations Component
const TherapyRecommendations: React.FC<TherapyRecommendationsProps> = ({ navigation }) => {
  const [recommendations, setRecommendations] = useState<TherapyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch therapy recommendations on component mount
  useEffect(() => {
    fetchTherapyRecommendations();
  }, []);

  const fetchTherapyRecommendations = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        console.error("[ERROR] User ID not found in AsyncStorage");
        Alert.alert("Error", "User ID not found. Please log in again.");
        return;
      }

      console.log(`[DEBUG] Fetching therapy recommendations for user: ${userId}`);

      const response = await axios.get<{ recommendations: TherapyItem[] }>(
        `http://192.168.200.25:5000/ar_therapy/${userId}`
      );

      console.log("[DEBUG] API Response:", response.data);

      if (!response.data || !response.data.recommendations.length) {
        throw new Error("Invalid API response: No recommendations found");
      }

      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error("[ERROR] Failed to fetch therapy recommendations:", error);
      Alert.alert("Error", "Failed to fetch therapy recommendations.");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to TherapyDetails page when a user selects an option
  const handleTherapySelect = (therapyName: TherapyItem) => {
    console.log("[DEBUG] User selected therapy:", therapyName);
    navigation.navigate("TherapyDetails", { therapyName }); // ✅ Pass therapyName
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
      <Text style={styles.header}>Schedules For You</Text>
      {recommendations.length === 0 ? (
        <Text style={styles.noDataText}>No recommendations found.</Text>
      ) : (
        recommendations.map((therapyName, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => handleTherapySelect(therapyName)}
          >
            <Text style={styles.cardTitle}>Option {index + 1}</Text>
            <Text style={styles.cardSubtitle}>{therapyName}</Text>
            <Text style={styles.cardArrow}>›</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#00BBD3" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noDataText: { textAlign: "center", fontSize: 16, color: "gray", marginTop: 20 },
  card: {
    backgroundColor: "#E6F7FF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5, color: "#333" },
  cardSubtitle: { fontSize: 14, color: "#666", marginBottom: 10 },
  cardArrow: { fontSize: 20, color: "#00BBD3", alignSelf: "flex-end" },
});

export default TherapyRecommendations;
