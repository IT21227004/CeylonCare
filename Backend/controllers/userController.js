const { signInWithEmailAndPassword } = require("firebase/auth");
const { createUserWithEmailAndPassword } = require("firebase/auth");
const { doc, setDoc } = require("firebase/firestore");
const { auth, db } = require("../firebaseConfig");

const registerUser = async (req, res) => {
  const { email, password, fullName, mobileNumber, dob } = req.body;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

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

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Error logging in:", error.message);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { registerUser, loginUser };

const sendResetPasswordEmail = async (req, res) => {
  const { email } = req.body;

  try {
    await sendPasswordResetEmail(auth, email);
    res.status(200).json({ message: "Password reset email sent successfully!" });
  } catch (error) {
    console.error("Error sending reset email:", error.message);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { sendResetPasswordEmail };