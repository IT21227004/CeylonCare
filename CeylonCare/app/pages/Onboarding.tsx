import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    image: require("../../assets/images/onBoarding 1.png"),
    title: "Enter Your Health Data",
    description:
      "Share your health info to get personalized tips for a healthier you!",
  },
  {
    id: "2",
    image: require("../../assets/images/onBoarding 2.png"),
    title: "Get Personal Health Advices",
    description: "Get tailored health advice to take better care of yourself!",
  },
  {
    id: "3",
    image: require("../../assets/images/onBoarding 3.png"),
    title: "Be Healthy",
    description: "Stay on top of your health with simple and smart choices!",
  },
];

const Onboarding = ({ navigation }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const checkSessionValidity = async () => {
      try {
        const loginTimestamp = await AsyncStorage.getItem("loginTimestamp");

        if (loginTimestamp) {
          const now = new Date().getTime();
          const savedTime = new Date(loginTimestamp).getTime();
          const timeDifference = now - savedTime;

          console.log("Session validity check in Onboarding:");
          console.log("Login timestamp:", loginTimestamp);
          console.log("Current time:", new Date(now).toISOString());
          console.log("Time difference (ms):", timeDifference);

          if (timeDifference >= 86400000) {
            console.log("Session expired. Redirecting to Splash...");
            await AsyncStorage.removeItem("userId");
            await AsyncStorage.removeItem("loginTimestamp");
            navigation.reset({
              index: 0,
              routes: [{ name: "Splash" }],
            });
          }
        } else {
          console.log("No session found. Redirecting to Splash...");
          navigation.reset({
            index: 0,
            routes: [{ name: "Splash" }],
          });
        }
      } catch (error) {
        console.error(
          "Error during session validation in Onboarding:",
          error.message
        );
      }
    };

    checkSessionValidity();
  }, [navigation]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex });
    } else {
      navigation.navigate("Home");
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.slide}>
      <View style={styles.ellipse}>
        <LinearGradient
          colors={["#ECF2FF", "rgba(236, 242, 255, 0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1, borderRadius: 9999 }}
        />
      </View>

      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleSkip = () => {
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={onboardingData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ref={flatListRef}
      />
      <View style={styles.pagination}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <LinearGradient
          colors={["#33E4DB", "#00BBD3"]}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>
            {currentIndex === onboardingData.length - 1
              ? "Get Started"
              : "Next"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },

  skipButton: {
    position: "absolute",
    top: 50,
    right: 25,
    zIndex: 1,
  },

  skipText: {
    fontSize: 15,
    color: "#33E4DB",
    fontWeight: 300,
    fontFamily: "League Spartan",
  },

  // backButton: {
  //   position: "absolute",
  //   left: 15,
  //   top: 30,
  //   width: 40,
  //   height: 40,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },

  // backButtonImage: {
  //   width: 24,
  //   height: 24,
  //   resizeMode: "contain",
  // },

  slide: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  ellipse: {
    position: "absolute",
    width: 365,
    height: 350,
    top: 100,
    bottom: 100,
    transform: [{ rotate: "-180deg" }],
    borderRadius: 9999,
  },

  image: {
    width: 300,
    height: 250,
  },

  title: {
    width: 280,
    fontSize: 32,
    color: "#13CAD6",
    fontWeight: 500,
    textAlign: "center",
    fontFamily: "League Spartan",
    marginBottom: 30,
  },

  description: {
    width: 240,
    fontSize: 12,
    fontWeight: 300,
    color: "#252525",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 9999,
    backgroundColor: "#E9F6FE",
    marginHorizontal: 5,
  },

  activeDot: {
    backgroundColor: "#13CAD6",
  },

  inactiveDot: {
    backgroundColor: "#E9F6FE",
  },

  button: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 100,
    alignItems: "center",
    marginBottom: 50,
  },

  gradientButton: {
    width: 200,
    paddingVertical: 15,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    textAlign: "center",
    color: "white",
    fontSize: 24,
    fontWeight: 500,
    fontFamily: "League Spartan",
  },
});

export default Onboarding;
