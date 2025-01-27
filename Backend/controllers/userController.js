const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} = require("firebase/auth");
const { doc, setDoc, getDoc, updateDoc } = require("firebase/firestore");
const { auth, db } = require("../firebaseConfig");

// Register User
const registerUser = async (req, res) => {
  const { email, password, fullName, mobileNumber, dob } = req.body;
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userId = userCredential.user.uid;

    await setDoc(doc(db, "users", userId), {
      fullName,
      mobileNumber,
      dob,
      email,
      profilePhoto: null,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Return a login timestamp
    const loginTimestamp = new Date().toISOString();

    res.status(200).json({
      message: "Login successful",
      user: { uid: user.uid, email: user.email },
      loginTimestamp,
    });
  } catch (error) {
    console.error("Error logging in:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// Send Reset Password Email
const sendResetPasswordEmail = async (req, res) => {
  const { email } = req.body;
  try {
    await sendPasswordResetEmail(auth, email);
    res
      .status(200)
      .json({ message: "Password reset email sent successfully!" });
  } catch (error) {
    console.error("Error sending reset email:", error.message);
    res.status(400).json({ error: error.message });
  }
};

// Logout User
const logoutUser = async (req, res) => {
  try {
    console.log("Logout request received");

    // Simulating session cleanup or token invalidation logic (if applicable)
    res.status(200).json({ message: "User logged out successfully" });
    console.log("Logout successful");
  } catch (error) {
    console.error("Error during logout:", error.message);
    res.status(500).json({ error: "Failed to log out" });
  }
};

// Get User Profile
const getUserProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      res.status(200).json(userSnapshot.data());
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  const { userId } = req.params;
  const { fullName, mobileNumber } = req.body;
  const profilePhoto = req.file;

  try {
    const userRef = doc(db, "users", userId);
    let profilePhotoUrl = null;

    if (profilePhoto) {
      profilePhotoUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/profilePhotos/${profilePhoto.filename}`;
    }

    const updatedData = {
      ...(fullName && { fullName }),
      ...(mobileNumber && { mobileNumber }),
      ...(profilePhotoUrl && { profilePhoto: profilePhotoUrl }),
    };

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    await updateDoc(userRef, updatedData);
    const updatedUser = await getDoc(userRef);
    res.status(200).json(updatedUser.data());
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendResetPasswordEmail,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};
