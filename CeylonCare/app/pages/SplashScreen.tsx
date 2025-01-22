import { LinearGradient } from "expo-linear-gradient";
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
        {/* Log In Button */}
        <LinearGradient
  colors={["#33E4DB", "#00BBD3"]}
  style={styles.loginButton}
>
  <TouchableOpacity onPress={() => navigation.navigate("Login")}>
    <Text style={styles.loginText}>Log In</Text>
  </TouchableOpacity>
</LinearGradient>

        {/* Sign Up Button */}
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
    width: 207,
    height: 45,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 10
  },
  loginText: {
    color: 'white', 
    fontSize: 24, 
    fontFamily: 'League Spartan', 
    fontWeight: '500', 
    textTransform: 'capitalize', 
    wordWrap: 'break-word'
  },
  signupButton: {
    flexDirection: "column",
    width: 207,
    height: 45,
    backgroundColor: "#E9F6FE",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 10
  },
  signupText: {
    color: '#13CAD6', 
    fontSize: 24, 
    fontFamily: 'League Spartan', 
    fontWeight: '500', 
    textTransform: 'capitalize', 
    wordWrap: 'break-word'
  },
});

export default SplashScreen;
