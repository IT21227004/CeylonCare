import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const PrivacyPolicy = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={["#33E4DB", "#00BBD3"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Update: 14/08/2024</Text>
        <Text style={styles.paragraph}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
          pellentesque congue lorem, vel tincidunt tortor placerat a. Proin ac
          diam quam. Aenean in sagittis magna, ut feugiat diam. Fusce a
          scelerisque neque, sed accumsan metus.
        </Text>
        <Text style={styles.paragraph}>
          Nunc auctor tortor in dolor luctus, quis euismod urna tincidunt.
          Aenean arcu metus, bibendum at rhoncus at, volutpat ut lacus. Morbi
          pellentesque malesuada eros semper ultrices. Vestibulum lobortis enim
          vel neque auctor, a ultrices ex placerat. Mauris ut lacinia justo, sed
          suscipit tortor. Nam egestas nulla posuere neque tincidunt porta.
        </Text>
        <Text style={styles.subHeading}>Terms & Conditions</Text>
        <Text style={styles.listItem}>
          1. Ut lacinia justo sit amet lorem sodales accumsan. Proin malesuada
          eleifend fermentum. Donec condimentum, nunc at rhoncus faucibus, ex
          nisi laoreet ipsum, eu pharetra eros est vitae orci.
        </Text>
        <Text style={styles.listItem}>
          2. Morbi quis rhoncus mi. Nullam lacinia ornare accumsan. Duis
          laoreet, ex eget rutrum pharetra, lectus nisl posuere risus, vel
          facilisis nisi tellus eu turpis.
        </Text>
        <Text style={styles.listItem}>
          3. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent
          pellentesque congue lorem, vel tincidunt tortor placerat a.
        </Text>
        <Text style={styles.listItem}>
          4. Nunc auctor tortor in dolor luctus, quis euismod urna tincidunt.
          Aenean arcu metus, bibendum at rhoncus at, volutpat ut lacus. Morbi
          pellentesque malesuada eros semper ultrices.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 40,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    alignSelf: "center",
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 20,
  },
  subHeading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#33E4DB",
    marginBottom: 10,
  },
  listItem: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 10,
  },
});

export default PrivacyPolicy;
