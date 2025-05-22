import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";

// Existing Pages
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
import CameraTest from "./pages/AR_component/CameraTest";

// Sri Lankan Food Recommendation Components
import HealthyFoodMain from "./pages/srilankan_food/HealthyFoodMain";
import HealthDataInput from "./pages/srilankan_food/HealthDataInput";
import FoodRecommendations from "./pages/srilankan_food/FoodRecommendations";
import FoodDetails from "./pages/srilankan_food/FoodDetails";
import MealPlan from "./pages/srilankan_food/MealPlan";
import FoodScanner from "./pages/srilankan_food/FoodScanner";
import ManualFoodInput from "./pages/srilankan_food/ManualFoodInput.jsx";

type RootStackParamList = {
  Splash: undefined;
  Register: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  Home: undefined;
  Profile: undefined;
  ProfileDetails: undefined;
  HealthDetails: undefined;
  PrivacyPolicy: undefined;
  TherapyRecommendations: undefined;
  TherapyDetails: { therapyName: string };
  ARAvatarScreen: undefined;
  CameraTest: undefined;
  ChatScreen: undefined;
  // Sri Lankan Food Recommendation screens
  HealthyFoodMain: undefined;
  HealthDataInput: undefined;
  FoodRecommendations: undefined;
  FoodDetails: { food: any };
  MealPlan: undefined;
  FoodScanner: undefined;
  ManualFoodInput: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Validate all screen components
const validateScreenComponent = (name: string, component: any) => {
  if (!component || typeof component !== 'function') {
    console.error(`[ERROR] Screen component "${name}" is invalid or undefined`);
    return false;
  }
  console.log(`[DEBUG] Screen component "${name}" loaded successfully`);
  return true;
};

const StackNavigator = () => {
  console.log('[DEBUG] StackNavigator initialized');

  // Validate all screen components before rendering
  const screens = [
    { name: 'Splash', component: SplashScreen },
    { name: 'Register', component: Register },
    { name: 'Login', component: Login },
    { name: 'ForgotPassword', component: ForgotPassword },
    { name: 'Onboarding', component: Onboarding },
    { name: 'Home', component: Home },
    { name: 'Profile', component: Profile },
    { name: 'ProfileDetails', component: ProfileDetails },
    { name: 'HealthDetails', component: HealthDetails },
    { name: 'PrivacyPolicy', component: PrivacyPolicy },
    { name: 'TherapyRecommendations', component: TherapyRecommendations },
    { name: 'TherapyDetails', component: TherapyDetails },
    { name: 'ARAvatarScreen', component: ARAvatarScreen },
    { name: 'ChatScreen', component: ChatScreen },
    // Sri Lankan Food screens
    { name: 'HealthyFoodMain', component: HealthyFoodMain },
    { name: 'HealthDataInput', component: HealthDataInput },
    { name: 'FoodRecommendations', component: FoodRecommendations },
    { name: 'FoodDetails', component: FoodDetails },
    { name: 'MealPlan', component: MealPlan },
    { name: 'FoodScanner', component: FoodScanner },
    { name: 'ManualFoodInput', component: ManualFoodInput },
  ];

  // Log validation results
  screens.forEach(screen => validateScreenComponent(screen.name, screen.component));

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
      
      {/* Profile Screens */}
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
      
      {/* AR Component Screens */}
      <Stack.Screen
        name="TherapyRecommendations"
        component={TherapyRecommendations}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TherapyDetails"
        component={TherapyDetails}
        initialParams={{ therapyName: 'Default Therapy' }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ARAvatarScreen"
        component={ARAvatarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CameraTest"
        component={CameraTest}
        options={{ headerShown: false }}
      />
      
      {/* Chatbot Component Screens */}
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ headerShown: false }}
      />

      {/* Sri Lankan Food Recommendation Screens */}
      <Stack.Screen
        name="HealthyFoodMain"
        component={HealthyFoodMain}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HealthDataInput"
        component={HealthDataInput}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodRecommendations"
        component={FoodRecommendations}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodDetails"
        component={FoodDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MealPlan"
        component={MealPlan}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodScanner"
        component={FoodScanner}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ManualFoodInput"
        component={ManualFoodInput}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;