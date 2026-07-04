// controllers/workflowController.js
const workflowService = require("../services/workflowService");

exports.runNextStage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;

    const result = await workflowService.runNextStage(projectId, userId);
    res.json(result);
  } catch (err) {
    console.error("Workflow Next Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;

    const status = await workflowService.getWorkflowStatus(projectId, userId);
    res.json({ success: true, workflow: status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reset = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.params;

    const workflow = await workflowService.resetWorkflow(projectId, userId);
    res.json({ success: true, workflow });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
