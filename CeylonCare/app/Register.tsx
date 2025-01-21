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
import { auth } from "../../Backend/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

const Register = ({ navigation }: any) => {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [dob, setDob] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !password || !email || !mobileNumber || !dob) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    console.log("Data sent to backend:", {
      email,
      password,
      fullName,
      mobileNumber,
      dob,
    });

    try {
      const response = await fetch("http://192.168.8.134:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          mobileNumber,
          dob,
        }),
      });

      const responseBody = await response.json();
      console.log("Response from backend:", responseBody);

      if (response.ok) {
        Alert.alert("Success", "Account created successfully");
        navigation.navigate("Login");
      } else {
        throw new Error(responseBody.error || "Registration failed");
      }
    } catch (error: any) {
      console.error("Error on frontend:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const handleConfirmDate = (date: Date) => {
    setDob(moment(date).format("DD / MM / YYYY")); // Format the date
    setDatePickerVisibility(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>New Account</Text>

        <TouchableOpacity onPress={() => navigation.navigate("Splash")}>
          <Text>back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={fullName}
          onChangeText={setFullName}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          textContentType="emailAddress"
          placeholder="example@example.com"
          value={email}
          onChangeText={setEmail}
        />

        {/* Mobile Number */}
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          textContentType="telephoneNumber"
          placeholder="0777777"
          keyboardType="phone-pad"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />

        {/* Date of Birth */}
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setDatePickerVisibility(true)}
        >
          <Text style={{ color: dob ? "#13CAD6" : "#A9A9A9" }}>
            {dob || "DD / MM / YYYY"}
          </Text>
        </TouchableOpacity>

        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisibility(false)}
        />

        <Text style={styles.termsText}>
          By continuing, you agree to{" "}
          <Text style={styles.link}>Terms of Use</Text> and
          <Text style={styles.link}> Privacy Policy</Text>.
        </Text>

        {/* Sign Up Button */}
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Login")}
          >
            Log in
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  header: {
    backgroundColor: "#33E4DB",
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    color: "#FFFFFF",
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
  },
  input: {
    backgroundColor: "#E9F6FE",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E9F6FE",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    fontSize: 16,
    color: "#13CAD6",
    justifyContent: "center",
  },
  termsText: {
    fontSize: 12,
    color: "#252525",
    marginBottom: 15,
    textAlign: "center",
  },
  link: {
    color: "#13CAD6",
    fontWeight: "500",
  },
  signUpButton: {
    backgroundColor: "#33E4DB",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  footerText: {
    fontSize: 12,
    color: "#252525",
    textAlign: "center",
  },
});

export default Register;
