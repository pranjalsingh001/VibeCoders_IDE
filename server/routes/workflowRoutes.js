const express = require("express");
const router = express.Router({ mergeParams: true });
const { protect } = require("../middlewares/authMiddleware");
const workflowCtrl = require("../controllers/workflowController");

router.post("/next", protect, workflowCtrl.runNextStage);
router.get("/status", protect, workflowCtrl.getStatus);
router.post("/reset", protect, workflowCtrl.reset);

module.exports = router;
