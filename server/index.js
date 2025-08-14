// Core dependencies
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// Internal modules
const connectDB = require("./config/db");       // MongoDB connection setup
const loadEnv = require("./config/dotenv");     // Loads environment variables from .env
const rateLimiter = require("./middlewares/rateLimiter"); // Rate limiting middleware

// Load environment variables & connect to database
loadEnv();          // Loads environment variables before anything else
connectDB();        // Establish connection to MongoDB

const app = express();

// Middlewares
app.use(cors());                    // Enables Cross-Origin requests
app.use(helmet());                  // Sets secure HTTP headers
app.use(compression());            // Compresses response bodies
app.use(morgan("dev"));            // Logger for HTTP requests in dev mode
app.use(express.json());           // Parses incoming JSON requests
app.use(rateLimiter);              // Protects API from abuse by rate limiting

// Routes
const authRoutes = require("./routes/authRoutes");
const blueprintRoutes = require("./routes/blueprintRoutes");

// Mount routes with base path
app.use("/api/v1/auth", authRoutes);            
app.use("/api/v1/blueprint", blueprintRoutes); 

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: Date.now() });
});

// Default route
app.get("/", (req, res) => {
  res.send("VibeCoders API Running");
});

// Handle 404 - Route Not Found
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({ message: "Internal Server Error" });
});

// Catch unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err.message);
  process.exit(1); // Exit process to avoid unknown state
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



