import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./_layout";

export default function App() {
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
}
