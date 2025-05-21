import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from '../../BottomNavBar';
import foodRecommendationModel from '../../../models/foodRecommendationModel';

const FoodRecommendations = ({ navigation }) => {
  const [recommendedFoods, setRecommendedFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userHealthData, setUserHealthData] = useState(null);
  
  useEffect(() => {
    loadUserHealthData();
  }, []);

  const loadUserHealthData = async () => {
    try {
      const saved = await AsyncStorage.getItem('userHealthData');
      const healthData = saved ? JSON.parse(saved) : {
        medicalConditions: ['High Blood Pressure'],
        age: '35', weight: '70', height: '170'
      };
      setUserHealthData(healthData);
  
      // **await** here too, so loadUserHealthData doesn’t return before recommendations finish
      await generateRecommendations(healthData);
    } catch (error) {
      console.error('Error loading health data:', error);
      setLoading(false);
    }
  };
  

  const generateRecommendations = async (healthData) => {
    setLoading(true);
    try {
      // Wait for the promise to resolve:
      const recommendations = await foodRecommendationModel.recommend(healthData, 8);
  
      // Add image paths for display
      const recommendationsWithImages = recommendations.map(food => ({
        ...food,
        image: getImageForFood(food.name)
      }));
      
      setRecommendedFoods(recommendationsWithImages);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const getImageForFood = (foodName) => {
    // Map food names to image assets
    const imageMap = {
      'Gotukola Sambol': require('../../../assets/images/food-icon.png'),
      'Kola Kanda (Herbal Porridge)': require('../../../assets/images/food-icon.png'),
      'Kathurumurunga Mallum': require('../../../assets/images/food-icon.png'),
      'Polos Curry (Young Jackfruit Curry)': require('../../../assets/images/food-icon.png'),
      'Kurakkan Kanda': require('../../../assets/images/food-icon.png'),
      'Boiled Red Kawpi (Cowpea)': require('../../../assets/images/food-icon.png'),
      'Karawila (Bitter Gourd) Curry': require('../../../assets/images/food-icon.png'),
      'Mung Bean Curry': require('../../../assets/images/food-icon.png'),
    };
    
    return imageMap[foodName] || require('../../../assets/images/food-icon.png');
  };
  
  const renderFoodItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.foodCard}
      onPress={() => navigation.navigate('FoodDetails', { food: item })}
    >
      <Image source={item.image} style={styles.foodImage} />
      <View style={styles.foodInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.foodName}>{item.name}</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>{item.score}/100</Text>
          </View>
        </View>
        <Text style={styles.foodBenefits}>{item.benefits}</Text>
        <View style={styles.conditionTags}>
          {item.healthConditions.map((condition, index) => (
            <LinearGradient
              key={index}
              colors={['#33E4DB', '#00BBD3']}
              style={styles.conditionTag}
            >
              <Text style={styles.conditionText}>{condition}</Text>
            </LinearGradient>
          ))}
        </View>
        <View style={styles.nutritionInfo}>
          <Text style={styles.nutritionText}>🕐 {item.cookingTime} min</Text>
          <Text style={styles.nutritionText}>🔥 {item.calories} cal</Text>
          <Text style={styles.nutritionText}>🍽️ {item.portion}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Recommendations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BBD3" />
          <Text style={styles.loadingText}>Generating personalized recommendations...</Text>
        </View>
        <BottomNavBar navigation={navigation} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Recommendations</Text>
      </View>
      
      <View style={styles.introContainer}>
        <Text style={styles.introText}>
          Based on your health profile, here are Sri Lankan foods that would benefit your wellbeing:
        </Text>
        {userHealthData && userHealthData.medicalConditions && (
          <View style={styles.conditionsContainer}>
            <Text style={styles.conditionsLabel}>Your conditions:</Text>
            <View style={styles.userConditionTags}>
              {userHealthData.medicalConditions.map((condition, index) => (
                <View key={index} style={styles.userConditionTag}>
                  <Text style={styles.userConditionText}>{condition}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
      
      <FlatList
        data={recommendedFoods}
        renderItem={renderFoodItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={() => generateRecommendations(userHealthData)}
      >
        <LinearGradient
          colors={['#33E4DB', '#00BBD3']}
          style={styles.refreshGradient}
        >
          <Text style={styles.refreshButtonText}>🔄 Generate New Recommendations</Text>
        </LinearGradient>
      </TouchableOpacity>
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#555555',
    fontFamily: 'League Spartan',
  },
  introContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  introText: {
    fontSize: 16,
    color: '#555555',
    lineHeight: 22,
    fontFamily: 'League Spartan',
    marginBottom: 12,
  },
  conditionsContainer: {
    marginTop: 8,
  },
  conditionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    fontFamily: 'League Spartan',
  },
  userConditionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  userConditionTag: {
    backgroundColor: '#E8FFF6',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  userConditionText: {
    fontSize: 12,
    color: '#00BBD3',
    fontWeight: '600',
    fontFamily: 'League Spartan',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120, // Account for bottom nav and refresh button
  },
  foodCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  foodInfo: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'League Spartan',
    flex: 1,
    marginRight: 10,
  },
  scoreContainer: {
    backgroundColor: '#E8FFF6',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  scoreText: {
    fontSize: 12,
    color: '#00BBD3',
    fontWeight: 'bold',
    fontFamily: 'League Spartan',
  },
  foodBenefits: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 12,
    fontFamily: 'League Spartan',
    lineHeight: 20,
  },
  conditionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  conditionTag: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  conditionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'League Spartan',
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  nutritionText: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'League Spartan',
  },
  refreshButton: {
    position: 'absolute',
    bottom: 90, // Above bottom nav
    left: 20,
    right: 20,
  },
  refreshGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'League Spartan',
  },
});

export default FoodRecommendations;