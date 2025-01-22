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
      <View style={styles.header}>
        <Text style={styles.headerText}>New Account</Text>
      </View>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#fff", padding: 20 },
  header: { alignItems: "center", padding: 20, backgroundColor: "#33E4DB" },
  headerText: { fontSize: 24, color: "#fff" },
  formContainer: { marginTop: 20 },
  label: { fontSize: 18, color: "#252525", marginBottom: 5 },
  input: {
    backgroundColor: "#E9F6FE",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  signUpButton: {
    backgroundColor: "#33E4DB",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  signUpButtonText: { color: "#fff", fontSize: 18 },
});

export default Register;
