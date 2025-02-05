import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// Define Type for Navigation Params
type RootStackParamList = {
  TherapyDetails: { therapyName: string };
};

// Define Props for TherapyDetails
type TherapyDetailsScreenProps = {
  route: RouteProp<RootStackParamList, "TherapyDetails">;
  navigation: StackNavigationProp<RootStackParamList, "TherapyDetails">;
};

const TherapyDetails: React.FC<TherapyDetailsScreenProps> = ({ route }) => {
  const { therapyName } = route.params || { therapyName: "Default Therapy" };

  console.log("[DEBUG] Therapy Details Screen Loaded:", therapyName);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Therapy: {therapyName}</Text>
      <Text style={styles.description}>Detailed guide on how to perform {therapyName}.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  description: { fontSize: 16, textAlign: "center", color: "#666" },
});

export default TherapyDetails;
