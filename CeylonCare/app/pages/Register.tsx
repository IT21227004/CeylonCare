import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { format } from "date-fns"; // Replace moment with date-fns
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

const Register = ({ navigation }: any) => {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [dob, setDob] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  // Log initial state for debugging
  console.log("[DEBUG] Register component mounted");
  console.log("[DEBUG] Initial fullName:", fullName);
  console.log("[DEBUG] Initial email:", email);
  console.log("[DEBUG] Initial mobileNumber:", mobileNumber);
  console.log("[DEBUG] Initial dob:", dob);

  const validateEmail = (input: string) => {
    console.log("[DEBUG] Validating email:", input);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(input)) {
      setEmailError("");
      console.log("[DEBUG] Email is valid");
    } else {
      setEmailError("Please enter a valid email address");
      console.log("[DEBUG] Email is invalid");
    }
    setEmail(input);
  };

  const validateMobileNumber = (input: string) => {
    console.log("[DEBUG] Validating mobile number:", input);
    const mobileRegex = /^[0-9]{10}$/;
    if (mobileRegex.test(input)) {
      setMobileError("");
      console.log("[DEBUG] Mobile number is valid");
    } else {
      setMobileError("Please enter a valid 10-digit mobile number");
      console.log("[DEBUG] Mobile number is invalid");
    }
    setMobileNumber(input);
  };

  const handleSignUp = async () => {
    console.log("[INFO] Sign Up button clicked");
    console.log("[DEBUG] Form data:", { fullName, email, password, mobileNumber, dob });

    if (!fullName || !password || !email || !mobileNumber || !dob) {
      Alert.alert("Error", "Please fill in all fields");
      console.log("[ERROR] Validation failed: Missing fields");
      return;
    }

    if (emailError || mobileError) {
      Alert.alert("Error", emailError || mobileError);
      console.log("[ERROR] Validation failed: Invalid email or mobile number");
      return;
    }

    try {
      console.log("[DEBUG] Sending request to backend...");
      const response = await fetch("http://192.168.60.22:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, fullName, mobileNumber, dob }),
      });

      console.log("[DEBUG] Response status:", response.status);
      const responseData = await response.json();
      console.log("[DEBUG] Response from backend:", responseData);

      if (response.ok) {
        Alert.alert("Success", "Account created successfully");
        console.log("[INFO] Registration successful, navigating to Login");
        navigation.navigate("Login");
      } else {
        throw new Error(responseData.error || "Registration failed");
      }
    } catch (error: any) {
      console.error("[ERROR] Sign Up failed:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const handleConfirmDate = (date: Date) => {
    console.log("[DEBUG] Date selected:", date);
    const formattedDate = format(date, "dd / MM / yyyy"); // Use date-fns format
    console.log("[DEBUG] Formatted date:", formattedDate);
    setDob(formattedDate);
    setDatePickerVisibility(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LinearGradient colors={["#33E4DB", "#00BBD3"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            console.log("[DEBUG] Back button pressed");
            navigation.goBack();
          }}
        >
          <Image
            source={require("../../assets/images/backIcon.png")}
            style={styles.backButtonImage}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>New Account</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={fullName}
          onChangeText={(text) => {
            console.log("[DEBUG] Full name changed:", text);
            setFullName(text);
          }}
        />

        <Text style={styles.label}>Password</Text>
        <View style={[styles.input, styles.passwordInputContainer]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="********"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              console.log("[DEBUG] Password changed (hidden for security)");
              setPassword(text);
            }}
          />
          <TouchableOpacity
            onPress={() => {
              console.log("[DEBUG] Toggling password visibility");
              setShowPassword(!showPassword);
            }}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#13CAD6"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@example.com"
          value={email}
          onChangeText={validateEmail}
          keyboardType="email-address"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="0777777777"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={validateMobileNumber}
        />
        {mobileError ? (
          <Text style={styles.errorText}>{mobileError}</Text>
        ) : null}

        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            console.log("[DEBUG] Opening date picker");
            setDatePickerVisibility(true);
          }}
        >
          <Text style={{ color: dob ? "#13CAD6" : "#A9A9A9" }}>
            {dob || "DD / MM / YYYY"}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => {
            console.log("[DEBUG] Date picker cancelled");
            setDatePickerVisibility(false);
          }}
        />

        <View style={styles.footerContainer}>
          <Text style={styles.terms}>
            By continuing, you agree to{" "}
            <Text
              style={styles.link}
              onPress={() => {
                console.log("[DEBUG] Navigating to PrivacyPolicy from Terms");
                navigation.navigate("PrivacyPolicy");
              }}
            >
              Terms of Use
            </Text>{" "}
            and{" "}
            <Text
              style={styles.link}
              onPress={() => {
                console.log("[DEBUG] Navigating to PrivacyPolicy from Privacy");
                navigation.navigate("PrivacyPolicy");
              }}
            >
              Privacy Policy
            </Text>
            .
          </Text>

          <LinearGradient
            colors={["#33E4DB", "#00BBD3"]}
            style={styles.signUpButton}
          >
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.footer}>
          Already have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => {
              console.log("[DEBUG] Navigating to Login from footer");
              navigation.navigate("Login");
            }}
          >
            Log In
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "white",
  },
  header: {
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 15,
    top: 30,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  headerText: {
    textAlign: "center",
    fontSize: 24,
    color: "white",
    fontFamily: "League Spartan",
    fontWeight: "600",
  },
  formContainer: {
    margin: 25,
  },
  label: {
    fontSize: 20,
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
    fontSize: 20,
    color: "#13CAD6",
    fontWeight: "400",
    fontFamily: "League Spartan",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F6FE",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E9F6FE",
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  passwordInput: {
    flex: 1,
    fontSize: 20,
    color: "#13CAD6",
    fontFamily: "League Spartan",
  },
  eyeIcon: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
  footerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  terms: {
    width: 200,
    fontSize: 12,
    color: "#252525",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 25,
    fontFamily: "League Spartan",
    fontWeight: "300",
  },
  link: {
    color: "#13CAD6",
    fontWeight: "500",
  },
  signUpButton: {
    width: 190,
    height: 50,
    borderRadius: 100,
    borderColor: "#33E4DB",
    borderWidth: 1,
    justifyContent: "center",
    gap: 10,
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  signUpButtonText: {
    textAlign: "center",
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "League Spartan",
  },
  footer: {
    fontFamily: "League Spartan",
    fontWeight: "300",
    fontSize: 12,
    color: "#252525",
    textAlign: "center",
    marginTop: 65,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Register;