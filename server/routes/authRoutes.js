const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// Route for registering new user
router.post("/register", registerUser);

// Route for logging in
router.post("/login", loginUser);

module.exports = router;
