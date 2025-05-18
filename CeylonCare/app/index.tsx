import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const App = () => {
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        console.log('[DEBUG] Checking login status');
        const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
        console.log('[DEBUG] Stored login timestamp:', loginTimestamp);

        if (loginTimestamp) {
          const now = new Date().getTime();
          const savedTime = new Date(loginTimestamp).getTime();
          const timeDifference = now - savedTime;

          console.log('[DEBUG] Current time:', new Date(now).toISOString());
          console.log('[DEBUG] Time difference (ms):', timeDifference);

          if (timeDifference < 86400000) {
            console.log('[DEBUG] User is still within the 24-hour login window');
          } else {
            console.log('[DEBUG] Login expired. Clearing stored session data.');
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('loginTimestamp');
          }
        } else {
          console.log('[DEBUG] No login timestamp found. User needs to log in.');
        }
      } catch (error) {
        console.error('[ERROR] Error checking login status:', error.message);
        Alert.alert('Error', 'Failed to check login status');
      }
    };

    checkLoginStatus();
  }, []);

  console.log('[DEBUG] Rendering NavigationContainer with StackNavigator');
  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default App;