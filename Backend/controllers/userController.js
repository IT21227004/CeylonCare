const { createUserWithEmailAndPassword } = require("firebase/auth");
const { doc, setDoc } = require("firebase/firestore");
const { auth, db } = require("../firebaseConfig");

const registerUser = async (req, res) => {
  const { email, password, fullName, mobileNumber, dob } = req.body;

  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Save additional user details to Firestore
    await setDoc(doc(db, "users", userId), {
      fullName,
      mobileNumber,
      dob,
      email,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: "User registered successfully", user: userCredential.user });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { registerUser };
