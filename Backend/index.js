const express = require("express");
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { setDoc, doc, getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBCMV00vJLRVMOPm_YPn-RNDkUEep3_hGw",
  authDomain: "my-app-68ab3.firebaseapp.com",
  projectId: "my-app-68ab3",
  storageBucket: "my-app-68ab3.firebasestorage.app",
  messagingSenderId: "741610664447",
  appId: "1:741610664447:android:1b5ff1cff7aa51844777ca",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const server = express();
server.use(express.json());

server.post("/register", async (req, res) => {
  const { email, password, fullName, mobileNumber, dob } = req.body;

  console.log("Received registration data:", {
    email,
    password,
    fullName,
    mobileNumber,
    dob,
  });

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const userId = userCredential.user.uid;
    console.log("User created in Firebase Auth with UID:", userId);

    await setDoc(doc(db, "users", userId), {
      fullName,
      mobileNumber,
      dob,
      email,
      createdAt: new Date().toISOString(),
    });

    console.log("User stored in Firestore successfully.");
    res.status(201).json({ user: userCredential.user });
  } catch (error) {
    console.error("Error in registration process:", error.message);
    res.status(400).json({ error: error.message });
  }
});

server.listen(5000, () => {
  console.log("Backend server running on http://localhost:5000");
});
