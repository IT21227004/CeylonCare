
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavBar from '../../BottomNavBar';

const { width } = Dimensions.get('window');

const FoodDetails = ({ navigation, route }) => {
  const { food } = route.params;
  
  // Mock recipe data - you can expand this or get it from your models
  const getRecipeDetails = (foodName) => {
    const recipes = {
      'Kola Kenda (Herbal Porridge)': {
        ingredients: [
          '2 cups mixed green leaves (gotukola, mukunuwenna, etc.)',
          '1 cup red rice',
          '1 cup coconut milk',
          '4 cups water',
          'Salt to taste',
          'Curry leaves'
        ],
        instructions: [
          'Clean and chop the mixed green leaves thoroughly',
          'Wash red rice and cook until very soft',
          'Blend cooked rice with chopped greens',
          'Add coconut milk and water, mix well',
          'Simmer for 15-20 minutes stirring occasionally',
          'Add salt and curry leaves before serving',
          'Serve hot as breakfast'
        ],
        nutritionalValue: {
          calories: '185 kcal',
          protein: '6g',
          carbs: '28g',
          fat: '7g',
          fiber: '8g'
        },
        recommendedTime: 'Morning (Breakfast)',
        recommendedPortion: 'One medium bowl (approximately 250ml)',
        difficulty: 'Medium',
        prepTime: '40 minutes'
      },
      'Gotukola Sambol': {
        ingredients: [
          '2 cups fresh gotukola leaves',
          '1/2 cup scraped coconut',
          '2 green chilies',
          '1 small onion, finely chopped',
          '2 tbsp lime juice',
          'Salt to taste'
        ],
        instructions: [
          'Clean gotukola leaves thoroughly and chop finely',
          'Mix chopped leaves with scraped coconut',
          'Add chopped onions and green chilies',
          'Add lime juice and salt',
          'Mix well and let it sit for 5 minutes',
          'Serve fresh as a side dish'
        ],
        nutritionalValue: {
          calories: '85 kcal',
          protein: '3g',
          carbs: '12g',
          fat: '4g',
          fiber: '5g'
        },
        recommendedTime: 'Any meal',
        recommendedPortion: '1/3 cup serving',
        difficulty: 'Easy',
        prepTime: '10 minutes'
      },
      'Polos Curry (Young Jackfruit Curry)': {
        ingredients: [
          '2 cups young jackfruit, cut into pieces',
          '1 cup coconut milk',
          '1 onion, sliced',
          '3 garlic cloves',
          '1 tsp turmeric powder',
          '1 tsp chili powder',
          'Curry leaves',
          'Salt to taste'
        ],
        instructions: [
          'Clean and cut young jackfruit into medium pieces',
          'Boil jackfruit pieces until tender (about 20 minutes)',
          'Heat oil and sauté onions and garlic',
          'Add turmeric and chili powder',
          'Add boiled jackfruit and mix well',
          'Pour coconut milk and simmer for 10 minutes',
          'Add curry leaves and salt to taste',
          'Serve hot with rice'
        ],
        nutritionalValue: {
          calories: '110 kcal',
          protein: '2g',
          carbs: '18g',
          fat: '4g',
          fiber: '12g'
        },
        recommendedTime: 'Lunch or Dinner',
        recommendedPortion: '3/4 cup serving',
        difficulty: 'Medium',
        prepTime: '35 minutes'
      }
    };
    
    return recipes[foodName] || {
      ingredients: ['Main ingredient', 'Seasonings', 'Water'],
      instructions: ['Clean ingredients', 'Cook according to traditional method', 'Serve hot'],
      nutritionalValue: {
        calories: food.calories + ' kcal',
        protein: '5g',
        carbs: '20g',
        fat: '3g',
        fiber: '6g'
      },
      recommendedTime: 'Any meal',
      recommendedPortion: food.portion || '1 serving',
      difficulty: 'Medium',
      prepTime: food.cookingTime + ' minutes'
    };
  };
  
  const recipe = getRecipeDetails(food.name);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{food.name}</Text>
      </View>
      
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Food Image */}
        <Image source={food.image} style={styles.foodImage} />
        
        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.foodName}>{food.name}</Text>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>⏱️ Prep Time</Text>
              <Text style={styles.metaValue}>{recipe.prepTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>👨‍🍳 Difficulty</Text>
              <Text style={styles.metaValue}>{recipe.difficulty}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>🔥 Calories</Text>
              <Text style={styles.metaValue}>{food.calories} cal</Text>
            </View>
          </View>
        </View>
        
        {/* Health Benefits Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Benefits</Text>
          <Text style={styles.benefitsText}>{food.benefits}</Text>
          
          <View style={styles.conditionTags}>
            {food.healthConditions && food.healthConditions.map((condition, index) => (
              <LinearGradient
                key={index}
                colors={['#33E4DB', '#00BBD3']}
                style={styles.conditionTag}
              >
                <Text style={styles.conditionText}>{condition}</Text>
              </LinearGradient>
            ))}
          </View>
          
          {food.score && (
            <View style={styles.healthScoreContainer}>
              <Text style={styles.healthScoreLabel}>Health Score for You</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.healthScoreValue}>{food.score}/100</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.listItemText}>{ingredient}</Text>
            </View>
          ))}
        </View>
        
        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preparation Steps</Text>
          {recipe.instructions.map((step, index) => (
            <View key={index} style={styles.listItem}>
              <LinearGradient
                colors={['#33E4DB', '#00BBD3']}
                style={styles.stepNumber}
              >
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </LinearGradient>
              <Text style={styles.listItemText}>{step}</Text>
            </View>
          ))}
        </View>
        
        {/* Nutritional Value Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutritional Information</Text>
          <View style={styles.nutritionContainer}>
            {Object.entries(recipe.nutritionalValue).map(([key, value], index) => (
              <View key={index} style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{value}</Text>
                <Text style={styles.nutritionLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Recommendation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serving Recommendations</Text>
          
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationLabel}>🕐 Best Time:</Text>
            <Text style={styles.recommendationText}>{recipe.recommendedTime}</Text>
          </View>
          
          <View style={styles.recommendationItem}>
            <Text style={styles.recommendationLabel}>🍽️ Portion Size:</Text>
            <Text style={styles.recommendationText}>{recipe.recommendedPortion}</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('FoodRecommendations')}
          >
            <Text style={styles.secondaryButtonText}>More Recommendations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MealPlan')}
          >
            <LinearGradient
              colors={['#33E4DB', '#00BBD3']}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonText}>Add to Meal Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
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
    fontSize: 20,
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
  contentContainer: {
    flex: 1,
  },
  foodImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'League Spartan',
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
    fontFamily: 'League Spartan',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'League Spartan',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    fontFamily: 'League Spartan',
  },
  benefitsText: {
    fontSize: 16,
    color: '#555555',
    lineHeight: 24,
    marginBottom: 16,
    fontFamily: 'League Spartan',
  },
  conditionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
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
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  healthScoreLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    fontFamily: 'League Spartan',
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8FFF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#00BBD3',
  },
  healthScoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00BBD3',
    fontFamily: 'League Spartan',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 16,
    color: '#00BBD3',
    marginRight: 12,
    width: 12,
    fontWeight: 'bold',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'League Spartan',
  },
  listItemText: {
    fontSize: 16,
    color: '#555555',
    flex: 1,
    lineHeight: 24,
    fontFamily: 'League Spartan',
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    width: '30%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00BBD3',
    marginBottom: 4,
    fontFamily: 'League Spartan',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
    fontFamily: 'League Spartan',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
    fontFamily: 'League Spartan',
  },
  recommendationText: {
    fontSize: 16,
    color: '#555555',
    flex: 1,
    fontFamily: 'League Spartan',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
    fontFamily: 'League Spartan',
  },
  primaryButton: {
    flex: 1,
  },
  primaryButtonGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'League Spartan',
  },
  bottomSpacing: {
    height: 100, // Space for bottom navigation
  },
});

export default FoodDetails;