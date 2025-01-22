const express = require("express");
const cors = require("cors");
const { registerUser, loginUser } = require("./controllers/userController");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.post("/register", registerUser);
app.post("/login", loginUser);

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
