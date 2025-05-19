import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

// Pages
import Register from "./pages/Register";
import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Profile from "./pages/profile/Profile";
import ProfileDetails from "./pages/profile/ProfileDetails";
import HealthDetails from "./pages/profile/HealthDetails";
import PrivacyPolicy from "./pages/profile/PrivacyPolicy";
import ChatScreen from "./pages/Chatbot_component/ChatScreen";
import TherapyRecommendations from "./pages/AR_component/TherapyRecommendations";
import TherapyDetails from "./pages/AR_component/TherapyDetails";
import ARAvatarScreen from "./pages/AR_component/ARAvatarScreen";
import ViewHealthRisk from "./pages/HealthRisk/ViewHealthRisk";
import AddHealthRisk from "./pages/HealthRisk/AddHealthRisk";
import EditHealthRisk from "./pages/HealthRisk/EditHealthRisk";

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Onboarding"
        component={Onboarding}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={Home}
        options={{ headerShown: false }}
      />

      {/* Profile */}
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileDetails"
        component={ProfileDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HealthDetails"
        component={HealthDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicy}
        options={{ headerShown: false }}
      />

      {/* AR_Component */}
      <Stack.Screen
        name="TherapyRecommendations"
        component={TherapyRecommendations}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TherapyDetails"
        component={TherapyDetails}
        initialParams={{ therapyName: "Default Therapy" }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ARAvatarScreen"
        component={ARAvatarScreen}
        options={{ headerShown: false }}
      />
      
      {/* Chatbot_Component */}
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      
      
      
      <Stack.Screen
        name="AddHealthRisk"
        component={AddHealthRisk}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ViewHealthRisk"
        component={ViewHealthRisk}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditHealthRisk"
        component={EditHealthRisk}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;