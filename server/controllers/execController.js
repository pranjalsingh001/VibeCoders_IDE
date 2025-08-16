const { startProjectContainer, stopProjectContainer } = require("../services/executionService");

// POST /api/v1/exec/start
exports.start = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.body;
    const result = await startProjectContainer({ userId, projectId });
    return res.status(200).json({ success: true, ...result });
  } catch (e) {
    console.error("Exec start error:", e);
    return res.status(500).json({ success: false, message: "Failed to start container" });
  }
};

// POST /api/v1/exec/stop
exports.stop = async (req, res) => {
  try {
    const { sessionId } = req.body;
    await stopProjectContainer({ sessionId });
    return res.status(200).json({ success: true, message: "Stopped" });
  } catch (e) {
    console.error("Exec stop error:", e);
    return res.status(500).json({ success: false, message: "Failed to stop container" });
  }
};
