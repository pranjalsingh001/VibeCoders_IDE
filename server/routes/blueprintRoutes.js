const express = require("express");
const router = express.Router();
const { generateBlueprint } = require("../controllers/blueprintController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route to generate blueprint from idea (only if logged in)
router.post("/generate", authMiddleware.protect, generateBlueprint);

module.exports = router;
