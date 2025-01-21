import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace YOUR_APP_ID with the actual app ID from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyA49uyARKZrIDlvVlb5w4xZkeoQk0aa96Q",
  authDomain: "ceyloncare-27525.firebaseapp.com",
  projectId: "ceyloncare-27525",
  storageBucket: "ceyloncare-27525.firebasestorage.app",
  messagingSenderId: "175865301482",
  appId: "1:175865301482:android:3efdcacc09434d9c328a93",
};

// Check if Firebase app is already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native persistence
const auth =
  getApps().length === 0
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      })
    : getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
