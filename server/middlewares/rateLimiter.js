const rateLimit = require("express-rate-limit");

// This rate limiter allows max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "⛔ Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
