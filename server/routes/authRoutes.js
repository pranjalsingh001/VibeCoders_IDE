const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getCurrentUser } = require("../controllers/authController");
const { protect } = require("../middlewares/authMiddleware");

// Route for registering new user
router.post("/signup", registerUser);

// Route for logging in
router.post("/login", loginUser);

// Route for getting current user info
router.get("/me", protect, getCurrentUser);

// Development route for testing auth bypass
router.get("/test", (req, res) => {
  res.json({ 
    message: "Auth routes are working",
    skipAuth: process.env.SKIP_AUTH === 'true',
    nodeEnv: process.env.NODE_ENV
  });
});

module.exports = router;
