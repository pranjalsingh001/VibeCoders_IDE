// routes/sessionRoutes.js
const express = require("express");
const router = express.Router({ mergeParams: true }); // Use Express Router, not the 'router' package
const { protect } = require("../middlewares/authMiddleware");

const {
  startSession,
  stopSession,
  getSessionStatus,
  getDockerStatus,
  debugContainer
} = require("../controllers/sessionController");

// All routes are prefixed with /api/v1/projects/:projectId/session

// Start a new runtime session for a project
router.post("/session/start", protect, startSession);

// Stop the active runtime session
router.post("/session/stop", protect, stopSession);

// Get the current session status
router.get("/session/status", protect, getSessionStatus);

// Get Docker status
router.get("/session/docker-status", protect, getDockerStatus);

// Debug container
router.get("/session/debug/container/:containerId", protect, debugContainer);

module.exports = router;