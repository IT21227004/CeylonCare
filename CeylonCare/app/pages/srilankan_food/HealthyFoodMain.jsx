import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavBar from '../../BottomNavBar';

const { width } = Dimensions.get('window');

const HealthyFoodMain = ({ navigation }) => {
  const menuItems = [
    {
      id: '1',
      title: 'Health Profile',
      description: 'Set up your health data',
      icon: require('../../../assets/images/health-icon.png'),
      navigateTo: 'HealthDataInput',
    },
    {
      id: '2',
      title: 'Food Recommendations',
      description: 'Personalized for you',
      icon: require('../../../assets/images/food-icon.png'),
      navigateTo: 'FoodRecommendations',
    },
    {
      id: '3',
      title: 'Meal Plan',
      description: 'Daily & weekly planning',
      icon: require('../../../assets/images/meal-plan-icon.png'),
      navigateTo: 'MealPlan',
    },
    {
      id: '4',
      title: 'Food Scanner',
      description: 'Analyze your meals',
      icon: require('../../../assets/images/camera-icon.png'),
      navigateTo: 'FoodScanner',
    },
    {
      id: '5',
      title: 'Manual Input',
      description: 'Enter your preferred foods',
      icon: require('../../../assets/images/input-icon.png'),
      navigateTo: 'ManualFoodInput',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Healthy Food Guide</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Sri Lankan</Text>
          <Text style={styles.welcomeHighlight}>Healthy Food</Text>
          <Text style={styles.welcomeText}>Recommendations</Text>
        </View>
        
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.navigateTo)}
            >
              <LinearGradient
                colors={['#33E4DB', '#00BBD3']}
                style={styles.iconContainer}
              >
                <Image source={item.icon} style={styles.menuIcon} resizeMode="contain" />
              </LinearGradient>
              <Text style={styles.menuText}>{item.title}</Text>
              <Text style={styles.menuSubtext}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <BottomNavBar navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: '#00BBD3',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'League Spartan',
    marginRight: 30,
  },
  backButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    color: '#555555',
    marginVertical: 2,
    fontFamily: 'League Spartan',
  },
  welcomeHighlight: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3CA19C',
    marginVertical: 2,
    fontFamily: 'League Spartan',
  },
  menuGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    width: width * 0.42,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    tintColor: 'white',
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'League Spartan',
  },
  menuSubtext: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    fontFamily: 'League Spartan',
  },
});

export default HealthyFoodMain;