import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./_layout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export default function App() {
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loginTimestamp = await AsyncStorage.getItem("loginTimestamp");
        console.log("Stored login timestamp:", loginTimestamp);

        if (loginTimestamp) {
          const now = new Date().getTime();
          const savedTime = new Date(loginTimestamp).getTime();
          const timeDifference = now - savedTime;

          console.log("Current time:", new Date(now).toISOString());
          console.log("Time difference (ms):", timeDifference);

          // Check if 24 hours have passed (86400000ms = 24 hours)
          if (timeDifference < 86400000) {
            console.log("User is still within the 24-hour login window");
          } else {
            console.log("Login expired. Clearing stored session data.");
            await AsyncStorage.removeItem("userId");
            await AsyncStorage.removeItem("loginTimestamp");
          }
        } else {
          console.log("No login timestamp found. User needs to log in.");
        }
      } catch (error) {
        console.error("Error checking login status:", error.message);
        Alert.alert("Error", "Failed to check login status");
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}
