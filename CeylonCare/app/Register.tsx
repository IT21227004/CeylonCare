import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../backend/firebaseConfig";

export const RegisterPage = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [dob, setDob] = useState("");

  const handleRegister = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Registration successful!", "You can now log in.");
      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert("Registration failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Account</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          value={mobileNumber}
          onChangeText={setMobileNumber}
        />
        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          placeholder="DD / MM / YYYY"
          value={dob}
          onChangeText={setDob}
        />
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
        >
          <Text style={styles.registerText}>Sign Up</Text>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          By continuing, you agree to{" "}
          <Text style={styles.link}>Terms of Use</Text> and{" "}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  header: {
    backgroundColor: "#00BBD3",
    padding: 20,
    alignItems: "center",
  },
  title: { fontSize: 24, color: "white", fontWeight: "600" },
  form: { padding: 20 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: {
    backgroundColor: "#E9F6FE",
    borderRadius: 10,
    padding: 10,
    marginTop: 5,
  },
  registerButton: {
    marginTop: 20,
    backgroundColor: "#33E4DB",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  registerText: { color: "white", fontWeight: "bold" },
  termsText: { marginTop: 10, fontSize: 12, textAlign: "center" },
  link: { color: "#00BBD3", textDecorationLine: "underline" },
});

export default RegisterPage;
