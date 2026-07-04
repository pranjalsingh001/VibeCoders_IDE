// Core dependencies
const express = require("express");

const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const http = require("http");
const { initSocket } = require("./utils/socket");

// Internal modules
const connectDB = require("./config/db");
const loadEnv = require("./config/dotenv");
const rateLimiter = require("./middlewares/rateLimiter");

// Load environment variables & connect to database
loadEnv();
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(rateLimiter);
app.use(require('./middlewares/errorHandler'));

// Routes
const authRoutes = require("./routes/authRoutes");
const planningRoutes = require("./routes/planningRoutes");
const blueprintRoutes = require("./routes/blueprintRoutes");
const fileRoutes = require("./routes/fileRoutes");
const execRoutes = require("./routes/execRoutes");
const designRoutes = require("./routes/designRoutes");
const projectRoutes = require("./routes/projectRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const codeGenRoutes = require("./routes/codeGenRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const queueRoutes = require("./routes/queueRoutes");

// Mount routes with base path
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/planning", planningRoutes);
app.use("/api/v1/blueprint", blueprintRoutes);
app.use("/api/v1/design", designRoutes);
app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/exec", execRoutes);
app.use("/api/v1/projects", projectRoutes);

// ✅ CORRECTED: Mount session routes with projectId param
app.use("/api/v1/projects/:projectId", sessionRoutes);
app.use("/api/v1/codegen", codeGenRoutes);
app.use("/api/v1/projects/:projectId/workflow", workflowRoutes);

// Queue monitoring routes
app.use("/api/v1/queue", queueRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: Date.now() });
});

// Debug route for testing session endpoints
app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});

// Simple debug test endpoint
app.get("/api/v1/debug/test", (req, res) => {
  res.json({ 
    message: "Debug endpoints are working",
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug route for checking project LLD content (no auth required for debugging)
app.get("/api/v1/debug/project/:projectId/lld", async (req, res) => {
  try {
    const { projectId } = req.params;
    const DesignDoc = require("./models/DesignDoc");
    const Project = require("./models/Project");
    
    console.log(`🔍 [Debug] Checking LLD for project: ${projectId}`);
    
    const project = await Project.findById(projectId);
    if (!project) {
      console.log(`❌ [Debug] Project not found: ${projectId}`);
      return res.status(404).json({ error: "Project not found" });
    }
    
    const lld = await DesignDoc.findOne({ project: projectId, type: "LLD" }).sort({ createdAt: -1 });
    if (!lld) {
      console.log(`❌ [Debug] No LLD found for project: ${projectId}`);
      return res.status(404).json({ error: "No LLD found" });
    }
    
    // Check for social media terms
    const socialTerms = ['tweet', 'twitter', 'social', 'post', 'follow', 'like', 'retweet'];
    const foundTerms = socialTerms.filter(term => 
      lld.content.toLowerCase().includes(term.toLowerCase())
    );
    
    console.log(`✅ [Debug] LLD analysis complete for project: ${project.name}`);
    console.log(`📊 [Debug] Social terms found: ${foundTerms.join(', ') || 'none'}`);
    
    res.json({
      projectName: project.name,
      projectIdea: project.idea,
      projectDescription: project.description,
      lldLength: lld.content.length,
      lldPreview: lld.content.substring(0, 1000),
      socialTermsFound: foundTerms,
      hasSocialTerms: foundTerms.length > 0,
      createdAt: lld.createdAt
    });
  } catch (error) {
    console.error(`❌ [Debug] Error checking LLD:`, error);
    res.status(500).json({ error: error.message });
  }
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
  process.exit(1);
});

// Start HTTP server and initialize Socket.IO
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);