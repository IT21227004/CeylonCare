import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const Profile = ({ navigation }: any) => {
  const user = {
    name: "Jane Doe",
    phone: "+123 567 89000",
    email: "janedoe@example.com",
    profileImage: require("../../../assets/images/profile 1.png"),
  };

  const sections = [
    {
      id: "1",
      title: "Profile",
      icon: require("../../../assets/images/userIcon_prof.png"),
      navigateTo: "ProfileDetails",
    },
    {
      id: "2",
      title: "Health Data",
      icon: require("../../../assets/images/healthDataIcon_prof.png"),
      navigateTo: "HealthDetails",
    },
    {
      id: "3",
      title: "Payment Method",
      icon: require("../../../assets/images/paymentIcon_prof.png"),
      navigateTo: "PaymentMethod",
    },
    {
      id: "4",
      title: "Privacy Policy",
      icon: require("../../../assets/images/policyIcon_prof.png"),
      navigateTo: "PrivacyPolicy",
    },
    {
      id: "5",
      title: "Logout",
      icon: require("../../../assets/images/logOutIcon_prof.png"),
      navigateTo: "Logout",
    },
  ];

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");

      // Update the URL to match your backend endpoint
      const response = await fetch("http://192.168.94.21:5000/logout", {
        method: "POST",
      });

      console.log("Logout API response status:", response.status);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Logout response:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("User logged out successfully");

      // Clear AsyncStorage
      await AsyncStorage.removeItem("userId");
      console.log("AsyncStorage cleared");

      // Navigate to Splash Screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Splash" }],
      });
    } catch (error) {
      console.error("Error during logout:", error.message);
      Alert.alert("Error", error.message);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      "Are you sure?",
      "Do you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Logout", onPress: handleLogout },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <LinearGradient colors={["#33E4DB", "#00BBD3"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Profile</Text>

        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigation.navigate("Profile")}
        >
          <Image source={user.profileImage} style={styles.profileImage} />
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileInfo}>{user.phone}</Text>
            <Text style={styles.profileInfo}>{user.email}</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Options List */}
      <View style={styles.optionsContainer}>
        {sections.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={styles.option}
            onPress={
              section.title === "Logout"
                ? confirmLogout
                : () => navigation.navigate(section.navigateTo)
            }
          >
            <Image source={section.icon} style={styles.optionIcon} />
            <Text style={styles.optionText}>{section.title}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    position: "absolute",
    top: 20,
    alignSelf: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileDetails: {
    alignItems: "flex-start",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  profileInfo: {
    fontSize: 14,
    color: "white",
  },
  optionsContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E9F6FE",
  },
  optionIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#252525",
  },
  arrow: {
    fontSize: 20,
    color: "#252525",
  },
});

export default Profile;
