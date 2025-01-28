const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyBCMV00vJLRVMOPm_YPn-RNDkUEep3_hGw",
  authDomain: "my-app-68ab3.firebaseapp.com",
  projectId: "my-app-68ab3",
  storageBucket: "my-app-68ab3.firebasestorage.app",
  messagingSenderId: "741610664447",
  appId: "1:741610664447:android:1b5ff1cff7aa51844777ca",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { auth, db, storage };
