const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const loadEnv = require("./config/dotenv");

loadEnv();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("VibeCoders API Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
