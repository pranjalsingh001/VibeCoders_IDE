const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET; // Load from .env

/**
 * @desc   Register a new user
 * @route  POST /api/v1/auth/signup
 * @access Public
 */
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1️⃣ Check if all fields are provided
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // 2️⃣ Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create and save new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // 5️⃣ Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6️⃣ Respond with token + user
    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
    });
  } catch (error) {
    console.error("❌ Register Error:", error);
    res.status(500).json({ message: "Server error while registering." });
  }
};

/**
 * @desc   Login a user
 * @route  POST /api/v1/auth/login
 * @access Public
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate request body
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // 2️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    // 4️⃣ Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5️⃣ Respond with token + user
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error while logging in." });
  }
};
