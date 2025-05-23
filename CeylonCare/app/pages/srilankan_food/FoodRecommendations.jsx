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
  
      await generateRecommendations(healthData);
    } catch (error) {
      console.error('Error loading health data:', error);
      setLoading(false);
    }
  };
  

  const generateRecommendations = async (healthData) => {
    setLoading(true);
    try {
      const recommendations = await foodRecommendationModel.recommend(healthData, 8);
  
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
    // All your available images with their require statements (complete list from your screenshots)
    const availableImages = {
      // First batch
      'aguna_kola_mallum': require('../../../assets/images/srilankan_food/Aguna Kola Mallum.jpg'),
      'ambra_juice': require('../../../assets/images/srilankan_food/Ambra-Juice.jpg'),
      'amla_fruit': require('../../../assets/images/srilankan_food/amla-fruit.jpg'),
      'amla_juice_sri_sri_tattva': require('../../../assets/images/srilankan_food/amla-juice_-_Sri-Sri-Tattva.webp'),
      'anoda_juice': require('../../../assets/images/srilankan_food/anoda juice.png'),
      'anoda': require('../../../assets/images/srilankan_food/anoda.jpg'),
      'arrowroot_curry_hulankeeriya': require('../../../assets/images/srilankan_food/Arrowroot Curry-hulankeeriya.jpg'),
      //'ash_banana_atu_kesel_curry': require('../../../assets/images/srilankan_food/Ash Banana (Atu Kesel) Curry.jpg'),
      'belimal_tea': require('../../../assets/images/srilankan_food/Belimal Tea.jpg'),
      'belimal_juice': require('../../../assets/images/srilankan_food/belimal_juice.png'),
      'boild_manioc': require('../../../assets/images/srilankan_food/Boild manioc.jpg'),
      'boiled_manioc_with_coconut_sambol': require('../../../assets/images/srilankan_food/Boiled Manioc with Coconut Sambol.jpg'),
      'boiled_purple_yam': require('../../../assets/images/srilankan_food/Boiled Purple Yam.jpg'),
      'boiled_red_kawpi_cowpea': require('../../../assets/images/srilankan_food/Boiled Red Kawpi (Cowpea).jpeg'),
      'bowitiya_tea': require('../../../assets/images/srilankan_food/Bovitiya Tea.png'),
      'brown_rice_porridge': require('../../../assets/images/srilankan_food/Brown Rice Porridge.jpg.webp'),
      'brown_rice': require('../../../assets/images/srilankan_food/Brown Rice.jpg'),
      'cabbage_curry': require('../../../assets/images/srilankan_food/Cabbage Curry.jpg'),
      'carrot_and_potato_curry': require('../../../assets/images/srilankan_food/Carrot and Potato Curry.jpg'),
      'cashew_curry': require('../../../assets/images/srilankan_food/Cashew Curry.jpg'),
      'ceylon_olive_veralu': require('../../../assets/images/srilankan_food/CeylonOliveVeralu.jpg'),
      
      // Second batch
      'chili_and_garlic_salad': require('../../../assets/images/srilankan_food/Chili and Garlic Salad.jpg'),
      'coconut_jelly': require('../../../assets/images/srilankan_food/Coconut Jelly.jpg'),
      'cucumber_and_tomato_salad': require('../../../assets/images/srilankan_food/Cucumber & Tomato Salad.jpg'),
      'cucumber_salad': require('../../../assets/images/srilankan_food/Cucumber Salad.jpg'),
      'curry_leaves_salad': require('../../../assets/images/srilankan_food/Curry Leaves Salad.jpg'),
      'dandimala_boiled': require('../../../assets/images/srilankan_food/Dandinala Boiled.jpeg'),
      'del_breadfruit_curry': require('../../../assets/images/srilankan_food/Del (Breadfruit) Curry.jpg'),
      'del_atukos_curry_breadfruit_seed_curry': require('../../../assets/images/srilankan_food/Del Atukos Curry (Breadfruit Seed Curry).jpg'),
      'eggplant_and_tomato_stir_fry': require('../../../assets/images/srilankan_food/Eggplant and Tomato Stir Fry.jpg'),
      'eggplant_curry_brinjal_curry': require('../../../assets/images/srilankan_food/Eggplant Curry (Brinjal Curry).jpg'),
      'eggplant_curry_recipe_sri_lankan_style': require('../../../assets/images/srilankan_food/Eggplant_Curry_Recipe_Sri_Lankan_Style.jpg'),
      'face_papaya_curry': require('../../../assets/images/srilankan_food/FACE-Papaya-Curry.jpg'),
      'fenugreek_drink': require('../../../assets/images/srilankan_food/Fenugreek Drink.jpg'),
      'garlic_and_tomato_soup': require('../../../assets/images/srilankan_food/Garlic and Tomato Soup.webp'),
      'garlic_curry': require('../../../assets/images/srilankan_food/Garlic Curry.jpg'),
      'gotu_kola_herbal_tea': require('../../../assets/images/srilankan_food/Gotu Kola Herbal Tea.jpg'),
      'gotukola_sambol': require('../../../assets/images/srilankan_food/Gotukola Sambol.jpg'),
      'gotu_kola_sambolaya': require('../../../assets/images/srilankan_food/Gotu-Kola-Sambolaya.jpg'),
      'halmasso_fish_curry_sri_lankan_sprats_curry': require('../../../assets/images/srilankan_food/Halmasso Fish Curry )Sri Lankan Sprats Curry.jpeg'),
      'hoppers_appa': require('../../../assets/images/srilankan_food/Hoppers (Appa).png'),
      'hq720': require('../../../assets/images/srilankan_food/hq720 (1).jpg'),
      
      // Third batch
      'hq720_2': require('../../../assets/images/srilankan_food/hq720.jpg'),
      'hulankeeriya': require('../../../assets/images/srilankan_food/hulankeeriya.jpg'),
      'images_7': require('../../../assets/images/srilankan_food/images-7.jpeg'),
      'img_7611_edited': require('../../../assets/images/srilankan_food/img_7611-edited.webp'),
      'iramusu_tea': require('../../../assets/images/srilankan_food/Iramusu Tea.jpg'),
      'issan_chicken3': require('../../../assets/images/srilankan_food/issan_chicken3.jpg'),
      'jack_seed_dish': require('../../../assets/images/srilankan_food/Jack Seed Dish.jpg'),
      'jackfruit_leaf_soup': require('../../../assets/images/srilankan_food/Jackfruit Leaf Soup.jpg'),
      'kankun_stir_fry_water_spinach_stir_fry': require('../../../assets/images/srilankan_food/Kankun Stir-Fry (Water Spinach Stir-Fry).jpg'),
      'karapincha_soup': require('../../../assets/images/srilankan_food/Karapincha Soup.jpg'),
      'karawila_bitter_gourd_curry': require('../../../assets/images/srilankan_food/Karawila (Bitter Gourd) Curry.jpg'),
      'kathurumurunga_mallum': require('../../../assets/images/srilankan_food/Kathurumurunga Mallum.jpg'),
      //'kesel_muwa_curry_banana_flower_curry': require('../../../assets/images/srilankan_food/Kesel Muwa Curry (Banana Flower Curry).png'),
      'kirihodi_coconut_milk_gravy': require('../../../assets/images/srilankan_food/Kirihodi (Coconut Milk Gravy).jpg'),
      'kola_kanda': require('../../../assets/images/srilankan_food/Kola Kanda.jpg'),
      'kurakkan_rotti': require('../../../assets/images/srilankan_food/kurakkan_rotti.jpg'),
      'lime_and_ginger_tea': require('../../../assets/images/srilankan_food/Lime & Ginger Tea.jpg'),
      'lunu_kanda': require('../../../assets/images/srilankan_food/Lunu Kanda.jpg'),
      'lunu_miris': require('../../../assets/images/srilankan_food/Lunu Miris.jpg'),
      'maxresdefault_1': require('../../../assets/images/srilankan_food/maxresdefault (1).jpg'),
      'maxresdefault': require('../../../assets/images/srilankan_food/maxresdefault.jpg'),
      
      // Fourth batch
      'mugunuwanna_mallum': require('../../../assets/images/srilankan_food/Mugunuwanna Mallum.jpg'),
      'mung_bean_curry': require('../../../assets/images/srilankan_food/Mung Bean Curry.jpg'),
      //'murunga_leaves_mallum_drumstick_leaves': require('../../../assets/images/srilankan_food/Murunga Leaves Mallum (Drumstick Leaves.jpg'),
      'mushroom_soup': require('../../../assets/images/srilankan_food/Mushroom Soup.jpg'),
      'nilkatarolu_juice': require('../../../assets/images/srilankan_food/Nilkatarolu Juice.jpg'),
      'okra_ladyfinger_curry': require('../../../assets/images/srilankan_food/Okra (Ladyfinger) Curry.jpg'),
      'papaya_and_lime_juice_drink': require('../../../assets/images/srilankan_food/Papaya & Lime Juice Drink.jpg'),
      'papaya_and_lime_salad': require('../../../assets/images/srilankan_food/Papaya and Lime Salad.jpg'),
      'pol_sambol': require('../../../assets/images/srilankan_food/Pol Sambol.jpg'),
      'polos_curry_young_jackfruit_curry': require('../../../assets/images/srilankan_food/Polos Curry (Young Jackfruit Curry).jpg'),
      'polpala_drink': require('../../../assets/images/srilankan_food/Polpala Drink.jpg'),
      'polpala_drink_2': require('../../../assets/images/srilankan_food/polpala_drink.jpg'),
      'pumpkin_curry': require('../../../assets/images/srilankan_food/Pumpkin Curry.jpg'),
      'purple_yam_curry': require('../../../assets/images/srilankan_food/Purple Yam Curry.jpg'),
      'r7a1123': require('../../../assets/images/srilankan_food/R7A1123.jpg'),
      'ragi_porridge_closeup': require('../../../assets/images/srilankan_food/ragi-porridge-closeup.jpg'),
      'ranawara_tea': require('../../../assets/images/srilankan_food/Ranawara Tea.jpg'),
      'ranawara_1': require('../../../assets/images/srilankan_food/ranawara-1.jpg'),
      'ribbed_gourd_curry': require('../../../assets/images/srilankan_food/Ribbed Gourd Curry.jpg'),
      'roasted_chickpeas': require('../../../assets/images/srilankan_food/Roasted Chickpeas.jpg'),
      'soya_bean_curry': require('../../../assets/images/srilankan_food/Soya Bean Curry.jpg'),
      
      // Fifth batch
      'soya_bean_stir_fry': require('../../../assets/images/srilankan_food/Soya Bean Stir-Fry.jpg'),
      'squashed_eggplant_curry_batu': require('../../../assets/images/srilankan_food/Squashed Eggplant Curry- batu.jpg'),
      'sri_lankan_coconut_milk_soup_with_vegetables': require('../../../assets/images/srilankan_food/Sri Lankan Coconut Milk Soup with Vegetables.jpg'),
      'sri_lankan_steamed_fish_theri_with_fresh_herbs': require('../../../assets/images/srilankan_food/Sri Lankan Steamed Fish (Theri) with Fresh Herbs.jpg'),
      'starfruit_salad': require('../../../assets/images/srilankan_food/starfruit-salad.jpg'),
      'string_hoppers_idiyappam': require('../../../assets/images/srilankan_food/String Hoppers (Idiyappam).jpg'),
      'sukuma_curry_morunga': require('../../../assets/images/srilankan_food/Sukuma Curry (Morunga).jpg'),
      'sushine': require('../../../assets/images/srilankan_food/sushine.jpg'),
      'sweet_potato_and_coconut_balls': require('../../../assets/images/srilankan_food/Sweet Potato and Coconut Balls.jpg'),
      'sweet_potato_and_lentil_stew': require('../../../assets/images/srilankan_food/Sweet Potato and Lentil Stew.jpg'),
      'sweet_potato_chips': require('../../../assets/images/srilankan_food/Sweet Potato Chips.jpg'),
      'sweet_potato_curry': require('../../../assets/images/srilankan_food/Sweet Potato Curry.jpg'),
      'thalana_batu_curry_ribbed_gourd_curry': require('../../../assets/images/srilankan_food/Thalana Batu Curry (Ribbed Gourd Curry).jpg'),
      'thebu_kola_sambola_recipe': require('../../../assets/images/srilankan_food/Thebu-Kola-Sambola-Recipe.jpg'),
      'tomato_curry': require('../../../assets/images/srilankan_food/Tomato Curry.jpg'),
      'turmeric_tea_golden_milk': require('../../../assets/images/srilankan_food/Turmeric Tea (Golden Milk).jpg'),
      'white_kawpi': require('../../../assets/images/srilankan_food/white_kawpi.jpeg'),
      'whole_wheat_sandwich_bread_2': require('../../../assets/images/srilankan_food/whole-wheat-sandwich-bread-2.jpg'),
    };

    // Function to calculate similarity score between two strings
    const calculateSimilarity = (str1, str2) => {
      const s1 = str1.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const s2 = str2.toLowerCase().replace(/[^\w\s]/g, '').trim();
      
      // Exact match gets highest score
      if (s1 === s2) return 100;
      
      // Check if one string contains the other
      if (s1.includes(s2) || s2.includes(s1)) return 90;
      
      // Calculate word overlap
      const words1 = s1.split(' ');
      const words2 = s2.split(' ');
      
      let matchingWords = 0;
      let totalUniqueWords = new Set([...words1, ...words2]).size;
      
      words1.forEach(word1 => {
        words2.forEach(word2 => {
          if (word1 === word2 && word1.length > 2) { // Only count meaningful words
            matchingWords++;
          }
          // Partial word matching
          else if (word1.includes(word2) || word2.includes(word1)) {
            if (Math.min(word1.length, word2.length) > 3) {
              matchingWords += 0.7;
            }
          }
        });
      });
      
      return (matchingWords / totalUniqueWords) * 80;
    };

    // Normalize the food name
    const normalizedFoodName = foodName.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    let bestMatch = null;
    let bestScore = 0;
    
    // Loop through all available images and find the best match
    Object.keys(availableImages).forEach(imageName => {
      const normalizedImageName = imageName.replace(/_/g, ' '); // Convert underscores to spaces
      const score = calculateSimilarity(normalizedFoodName, normalizedImageName);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = imageName;
      }
    });

    // Enhanced keyword matching for common Sri Lankan foods
    const keywordMatches = [
      // Rice dishes
      { keywords: ['rice', 'bath', 'kiri'], match: 'brown_rice' },
      
      // Curries
      { keywords: ['curry', 'hodhi'], match: 'cabbage_curry' },
      { keywords: ['potato'], match: 'carrot_and_potato_curry' },
      { keywords: ['carrot'], match: 'carrot_and_potato_curry' },
      { keywords: ['cabbage'], match: 'cabbage_curry' },
      { keywords: ['cashew'], match: 'cashew_curry' },
      { keywords: ['ash banana', 'kesel'], match: 'ash_banana_atu_kesel_curry' },
      
      // Mallums
      { keywords: ['mallum', 'mallung'], match: 'aguna_kola_mallum' },
      { keywords: ['gotukola', 'gotu kola'], match: 'aguna_kola_mallum' },
      
      // Sambols
      { keywords: ['sambol', 'coconut'], match: 'boiled_manioc_with_coconut_sambol' },
      
      // Traditional foods
      { keywords: ['manioc', 'cassava'], match: 'boiled_manioc_with_coconut_sambol' },
      { keywords: ['yam', 'ala'], match: 'boiled_purple_yam' },
      { keywords: ['cowpea', 'kawpi', 'bean'], match: 'boiled_red_kawpi_cowpea' },
      
      // Porridge
      { keywords: ['porridge', 'kanda'], match: 'brown_rice_porridge' },
      
      // Fruits and juices
      { keywords: ['amla', 'nelli'], match: 'amla_fruit' },
      { keywords: ['juice'], match: 'ambra_juice' },
      { keywords: ['tea'], match: 'belimal_tea' },
      { keywords: ['olive', 'veralu'], match: 'ceylon_olive_veralu' },
      
      // Herbs and medicinal
      { keywords: ['belimal'], match: 'belimal_tea' },
      { keywords: ['bowitiya'], match: 'bowitiya_tea' },
      { keywords: ['anoda'], match: 'anoda' },
    ];

    // If similarity score is low, try keyword matching
    if (bestScore < 30) {
      for (const keywordMatch of keywordMatches) {
        for (const keyword of keywordMatch.keywords) {
          if (normalizedFoodName.includes(keyword)) {
            if (availableImages[keywordMatch.match]) {
              bestMatch = keywordMatch.match;
              bestScore = 50; // Give it a decent score
              break;
            }
          }
        }
        if (bestScore >= 50) break;
      }
    }

    console.log(`Food: "${foodName}" -> Best match: "${bestMatch}" (Score: ${bestScore})`);

    // Return the best match if score is reasonable, otherwise fallback
    if (bestMatch && bestScore > 20) {
      return availableImages[bestMatch];
    }

    // Final fallback
    return require('../../../assets/images/food-icon.png');
  }

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
    paddingBottom: 120,
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
    bottom: 90,
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