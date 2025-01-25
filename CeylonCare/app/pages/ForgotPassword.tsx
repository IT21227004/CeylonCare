import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

const ForgotPassword = ({ navigation }: any) => {
  const [email, setEmail] = useState("");

  const handleSendResetPasswordEmail = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email.");
      return;
    }

    try {
      console.log("Sending password reset request...");
      const response = await fetch(
        "http://192.168.218.168:5000/forgetPassword",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const responseData = await response.json();
      console.log("Response from backend:", responseData);

      if (response.ok) {
        Alert.alert(
          "Success",
          "A password reset email has been sent to your email address."
        );
        navigation.navigate("Login");
      } else {
        throw new Error(responseData.error || "Failed to send reset email");
      }
    } catch (error: any) {
      console.error("Error:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#33E4DB", "#00BBD3"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Set Password</Text>
      </LinearGradient>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="********"
            secureTextEntry
          />
          <TouchableOpacity style={styles.eyeIcon}>
            <Ionicons name="eye" size={20} color="#13CAD6" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="********"
            secureTextEntry
          />
          <TouchableOpacity style={styles.eyeIcon}>
            <Ionicons name="eye" size={20} color="#13CAD6" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleSendResetPasswordEmail}
        >
          <Text style={styles.resetButtonText}>Create New Password</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "white",
    padding: 20,
  },
  header: {
    height: 99,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 15,
  },
  headerText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "League Spartan",
    fontWeight: "600",
  },
  formContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 18,
    color: "#252525",
    marginBottom: 5,
    fontWeight: "500",
    fontFamily: "League Spartan",
  },
  input: {
    backgroundColor: "#E9F6FE",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E9F6FE",
    marginBottom: 15,
    fontSize: 16,
    color: "#13CAD6",
  },
  passwordInputContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 40, // Add padding to make space for the eye icon
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 12,
  },
  resetButton: {
    backgroundColor: "#33E4DB",
    borderRadius: 30,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "League Spartan",
  },
});

export default ForgotPassword;
