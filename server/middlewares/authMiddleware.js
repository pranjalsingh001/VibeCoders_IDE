const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');

// Middleware to protect routes by verifying the token
const protect = (req, res, next) => {
  // Development mode bypass
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';
  const skipAuth = process.env.SKIP_AUTH === 'true' || req.headers['x-dev-mode'] === 'true';
  
  if (isDevelopment && skipAuth) {
    console.log("🔧 Development mode: Bypassing authentication - UPDATED");
    // Create a mock user for development with a valid ObjectId
    const devUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    console.log("🔧 Development userId created:", devUserId, "Type:", typeof devUserId);
    req.user = {
      userId: devUserId, // Valid ObjectId for dev
      email: 'developer@test.com',
      role: 'user'
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  console.log("🔍 Auth Header:", authHeader); 

  // Check if token exists and starts with 'Bearer'
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  console.log("🔍 Token Extracted:", token); 

  try {
    // Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
     console.log("✅ Decoded User:", decoded); 

    // Attach the user info to request object for next middleware or controller
    req.user = decoded;

    next(); // Continue to route/controller
  } catch (err) {
     console.error("❌ JWT Error:", err.message); 
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = { protect };
