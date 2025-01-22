import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";

const SplashScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")} // Ensure "Login" is registered in your navigator
        >
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  loginButton: {
    width: "80%",
    paddingVertical: 15,
    backgroundColor: "#33E4DB",
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  loginText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupButton: {
    width: "80%",
    paddingVertical: 15,
    backgroundColor: "#E9F6FE",
    borderRadius: 30,
    alignItems: "center",
    borderColor: "#33E4DB",
    borderWidth: 1,
  },
  signupText: {
    color: "#33E4DB",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SplashScreen;
