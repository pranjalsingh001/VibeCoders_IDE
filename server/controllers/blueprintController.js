// controllers/blueprintController.js

const Blueprint = require("../models/Blueprint");
const blueprintBuilder = require("../services/blueprintBuilder");

/**
 * @desc    Generate a project blueprint from the user's idea
 * @route   POST /api/v1/blueprint/generate
 * @access  Private (requires JWT auth)
 */
exports.generateBlueprint = async (req, res) => {
  try {
    // ✅ Get logged-in user ID from auth middleware
    const userId = req.user?.userId;

    // ✅ Destructure request body
    const { projectName, ideaDescription } = req.body;

    // 🔍 Validate input
    if (!projectName || !ideaDescription) {
      return res.status(400).json({
        success: false,
        message: "❌ Project name and idea description are required.",
      });
    }

    // 🧠 Generate blueprint using AI service
    let blueprint;
    try {
      blueprint = await blueprintBuilder.generate(projectName, ideaDescription);
    } catch (err) {
      console.error("🚨 AI Blueprint Generation Error:", err.message);
      return res.status(502).json({
        success: false,
        message: "⚠️ Failed to generate blueprint from AI. Please try again later.",
      });
    }

    // 💾 Save to database
    const savedBlueprint = await Blueprint.create({
      user: userId,
      projectName,
      ideaDescription,
      generatedBlueprint: blueprint || {},
    });

    // 📤 Send response
    return res.status(201).json({
      success: true,
      message: "✅ Blueprint generated successfully.",
      blueprint: savedBlueprint,
    });

  } catch (error) {
    console.error("❌ Server Error (Blueprint Generation):", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please contact support.",
    });
  }
};

/**
 * @desc    Get all blueprints for a user
 * @route   GET /api/v1/blueprint
 * @access  Private
 */
exports.getUserBlueprints = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const blueprints = await Blueprint.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: blueprints.length,
      blueprints,
    });
  } catch (error) {
    console.error("❌ Server Error (Fetching Blueprints):", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blueprints.",
    });
  }
};
