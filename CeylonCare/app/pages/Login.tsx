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
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in both email and password.");
      return;
    }

    try {
      console.log("Sending login request...");
      const response = await fetch("http://192.168.60.22:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const responseData = await response.json();
      const { user } = responseData;

      console.log("Response from backend:", responseData);

      // Store userId in AsyncStorage
      await AsyncStorage.setItem("userId", user.uid);

      Alert.alert("Success", "Logged in successfully!");
      navigation.navigate("Onboarding"); // Navigate to the app's main screen
    } catch (error: any) {
      console.error("Login error:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={["#33E4DB", "#00BBD3"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Log In</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.subHeader}>
          Enter your credentials to access your account.
        </Text>

        <Text style={styles.label}>Email or Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="example@example.com"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="********"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#13CAD6"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.forgotPassword}>Forget Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Don’t have an account?{" "}
        <Text
          style={styles.link}
          onPress={() => navigation.navigate("Register")}
        >
          Sign Up
        </Text>
      </Text>
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
  welcome: {
    fontSize: 24,
    color: "#13CAD6",
    fontWeight: "600",
    fontFamily: "League Spartan",
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 14,
    color: "#252525",
    marginBottom: 20,
    lineHeight: 20,
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
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
    top: 12,
  },
  forgotPassword: {
    color: "#13CAD6",
    fontWeight: "500",
    marginBottom: 20,
    textAlign: "right",
  },
  loginButton: {
    backgroundColor: "#33E4DB",
    borderRadius: 30,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "League Spartan",
  },
  footer: {
    fontSize: 12,
    color: "#252525",
    textAlign: "center",
    marginTop: 20,
  },
  link: {
    color: "#13CAD6",
    fontWeight: "500",
  },
});

export default Login;
