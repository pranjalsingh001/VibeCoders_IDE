const { startProjectContainer, stopProjectContainer } = require("../services/executionService");
const { isDockerAvailable } = require("../services/dockerService");

// POST /api/v1/exec/start
exports.start = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required"
      });
    }

    // Check Docker availability
    if (!isDockerAvailable()) {
      return res.status(503).json({
        success: false,
        message: "Docker is not available. Please ensure Docker is running to execute code."
      });
    }

    console.log(`🚀 Starting execution for project ${projectId}`);
    const result = await startProjectContainer({ userId, projectId });

    return res.status(201).json({
      success: true,
      message: "🚀 Container started successfully",
      data: result,
    });
  } catch (e) {
    console.error("Exec start error:", e.message);
    return res.status(500).json({
      success: false,
      message: "Failed to start container",
      error: e.message
    });
  }
};

// POST /api/v1/exec/stop
exports.stop = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required"
      });
    }

    // Check Docker availability
    if (!isDockerAvailable()) {
      return res.status(503).json({
        success: false,
        message: "Docker is not available. Cannot stop container."
      });
    }

    console.log(`🛑 Stopping execution for session ${sessionId}`);
    await stopProjectContainer({ sessionId });

    return res.status(200).json({
      success: true,
      message: "🛑 Container stopped"
    });
  } catch (e) {
    console.error("Exec stop error:", e.message);
    return res.status(500).json({
      success: false,
      message: "Failed to stop container",
      error: e.message
    });
  }
};

// GET /api/v1/exec/status
exports.status = async (req, res) => {
  try {
    const dockerAvailable = isDockerAvailable();

    return res.status(200).json({
      success: true,
      dockerAvailable,
      message: dockerAvailable ?
        "Docker is available for code execution" :
        "Docker is not available. Code execution will be disabled."
    });
  } catch (e) {
    console.error("Exec status error:", e.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get execution status"
    });
  }
};