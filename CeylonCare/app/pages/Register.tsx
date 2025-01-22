import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons"; // Import Ionicons

const Register = ({ navigation }: any) => {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [dob, setDob] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const handleSignUp = async () => {
    console.log("Sign Up button clicked");

    if (!fullName || !password || !email || !mobileNumber || !dob) {
      Alert.alert("Error", "Please fill in all fields");
      console.log("Validation failed: missing fields");
      return;
    }

    try {
      console.log("Sending request to backend...");
      const response = await fetch("http://192.168.60.22:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, fullName, mobileNumber, dob }),
      });

      const responseData = await response.json();
      console.log("Response from backend:", responseData);

      if (response.ok) {
        Alert.alert("Success", "Account created successfully");
        navigation.navigate("Splash");
      } else {
        throw new Error(responseData.error || "Registration failed");
      }
    } catch (error: any) {
      console.error("Error in Sign Up:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const handleConfirmDate = (date: Date) => {
    setDob(moment(date).format("DD / MM / YYYY"));
    setDatePickerVisibility(false);
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
        <Text style={styles.headerText}>New Account</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@example.com"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="0777777777"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setDatePickerVisibility(true)}
        >
          <Text style={{ color: dob ? "#13CAD6" : "#A9A9A9" }}>
            {dob || "DD / MM / YYYY"}
          </Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisibility(false)}
        />

        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        By continuing, you agree to{" "}
        <Text style={styles.link}>Terms of Use</Text> and{" "}
        <Text style={styles.link}>Privacy Policy</Text>.
      </Text>
      <Text style={styles.footer}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
          Log In
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
    width: "100%",
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
    fontFamily: "League Spartan",
  },
  signUpButton: {
    backgroundColor: "#33E4DB",
    borderRadius: 30,
    alignItems: "center",
    paddingVertical: 15,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    fontFamily: "League Spartan",
  },
  terms: {
    fontSize: 12,
    color: "#252525",
    textAlign: "center",
    marginTop: 10,
  },
  link: {
    color: "#13CAD6",
    fontWeight: "500",
  },
  footer: {
    fontSize: 12,
    color: "#252525",
    textAlign: "center",
    marginTop: 15,
  },
});

export default Register;
