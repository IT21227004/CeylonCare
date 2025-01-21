const express = require("express");
const bodyParser = require("body-parser");
const { registerUser } = require("./services/authService");

const app = express();
app.use(bodyParser.json());

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await registerUser(email, password);
    res.status(200).send({ message: "User registered", user });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.listen(5000, () => console.log("Backend running on port 5000"));
