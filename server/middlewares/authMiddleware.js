const jwt = require("jsonwebtoken");

// Middleware to protect routes by verifying the token
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if token exists and starts with 'Bearer'
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user info to request object for next middleware or controller
    req.user = decoded;

    next(); // Continue to route/controller
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = { protect };
