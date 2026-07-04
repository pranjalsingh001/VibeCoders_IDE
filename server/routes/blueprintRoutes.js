const express = require("express");
const router = express.Router();
const { generateBlueprint, getUserBlueprints, getBlueprintByProjectId } = require("../controllers/blueprintController");
const { protect } = require("../middlewares/authMiddleware");

// 🔒 Generate blueprint from an existing Project (by projectId)
router.post("/generate", protect, generateBlueprint);

// 📂 Get all blueprints for logged-in user
router.get("/", protect, getUserBlueprints);

router.get("/:projectId", protect, getBlueprintByProjectId);

module.exports = router;
