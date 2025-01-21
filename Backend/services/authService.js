const { createUserWithEmailAndPassword } = require("firebase/auth");
const { auth } = require("../firebaseConfig");

const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = { registerUser };
