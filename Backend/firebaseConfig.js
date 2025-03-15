const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { getFirestore } = require("firebase/firestore");
const { getStorage } = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyBVzqr_mU73jZR4ySMFEuCBz4gxnppiI2Q",
  authDomain: "ceyloncare-bdefa.firebaseapp.com",
  projectId: "ceyloncare-bdefa",
  storageBucket: "ceyloncare-bdefa.firebasestorage.app",
  messagingSenderId: "935171317625",
  appId: "1:935171317625:android:227d446d43f688655dd9a8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { auth, db, storage };