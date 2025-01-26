const express = require("express");
const cors = require("cors");
const {
  registerUser,
  loginUser,
  sendResetPasswordEmail,
  getUserProfile,
  updateUserProfile,
} = require("./controllers/userController");
const upload = require("./middleware/uploadMiddleware");
const path = require("path");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve static files

app.post("/register", registerUser);
app.post("/login", loginUser);
app.post("/forgetPassword", sendResetPasswordEmail);
app.get("/user/:userId", getUserProfile);
app.put("/user/:userId", upload.single("profilePhoto"), updateUserProfile);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
