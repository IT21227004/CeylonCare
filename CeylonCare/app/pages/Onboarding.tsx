import React, { useState, useRef } from "react";
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

const { width } = Dimensions.get("window");

const onboardingData = [
  {
    id: "1",
    image: require("../../assets/images/onBoarding 1.png"),
    title: "Enter Your Health Data",
    description: "Share your health info to get personalized tips for a healthier you!",
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
  slide: {
    width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  image: {
    width: "80%",
    height: "50%",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: "#13CAD6",
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "League Spartan",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: "#252525",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    fontSize: 16,
    color: "#13CAD6",
    fontWeight: "500",
    fontFamily: "League Spartan",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    width: "80%",
    alignItems: "center",
    marginBottom: 20,
  },
  gradientButton: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "League Spartan",
  },
});

export default Onboarding;
