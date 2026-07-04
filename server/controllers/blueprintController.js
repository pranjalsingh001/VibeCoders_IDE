// controllers/blueprintController.js
// -----------------------------------
// Handles blueprint creation, retrieval, and linking with projects.
// Endpoints:
// - POST /api/v1/blueprint/generate → Generate a new blueprint
// - GET /api/v1/blueprint → Fetch all user blueprints
// - GET /api/v1/blueprint/:projectId → Fetch existing blueprint for a project

const mongoose = require("mongoose");
const Project = require("../models/Project");
const Blueprint = require("../models/Blueprint");
const DesignDoc = require("../models/DesignDoc");
const { generate } = require("../services/blueprintBuilder");

/**
 * @desc    Generate a blueprint for a project
 * @route   POST /api/v1/blueprint/generate
 * @access  Private (JWT required)
 */
exports.generateBlueprint = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user?.userId;

    // 1️⃣ Validate project ID
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "❌ Valid Project ID is required.",
      });
    }

    // 2️⃣ Verify project ownership
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "❌ Project not found or not owned by user.",
      });
    }

    // 3️⃣ Ensure the project has an idea description
    if (!project.idea?.trim()) {
      return res.status(400).json({
        success: false,
        message: "❌ Project idea is missing. Add a description before generating a blueprint.",
      });
    }

    // 4️⃣ Retrieve clarification answers (if available)
    const clarificationDoc = await DesignDoc.findOne({
      project: projectId,
      type: "clarification-answers",
    });
    const answers = clarificationDoc?.content || null;

    // 5️⃣ Generate blueprint using AI service
    let blueprintData;
    try {
      blueprintData = await generate({
        projectName: project.name,
        ideaDescription: project.idea,
        answers,
      });
    } catch (err) {
      console.error("🚨 AI Blueprint Generation Error:", err.message);
      return res.status(502).json({
        success: false,
        message: "⚠️ AI service failed to generate blueprint. Please try again later.",
      });
    }

    // 6️⃣ Save blueprint in DB
    const savedBlueprint = await Blueprint.create({
      user: userId,
      projectName: project.name,
      ideaDescription: project.idea.trim(),
      clarifications: answers,
      generatedBlueprint: blueprintData,
    });

    // 7️⃣ Link blueprint to project and update status
    project.blueprint = savedBlueprint._id;
    project.status = "planned";
    project.workflow.stage = "blueprint";
    project.workflow.status = "completed";
    await project.save();

    // 8️⃣ Return structured response for frontend (BlueprintPage.tsx expects `content`, `diagrams`, `createdAt`)
    return res.status(201).json({
      success: true,
      message: "✅ Blueprint generated successfully.",
      projectId: project._id,
      blueprint: {
        ...savedBlueprint.toObject(),
        generatedBlueprint: {
          content: blueprintData.content,
          diagrams: blueprintData.diagrams || {},
          createdAt: savedBlueprint.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Server Error (Blueprint Generation):", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while generating blueprint.",
    });
  }
};

/**
 * @desc    Fetch all blueprints for a user
 * @route   GET /api/v1/blueprint
 * @access  Private
 */
exports.getUserBlueprints = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Fetch all projects with populated blueprints
    const projects = await Project.find({ owner: userId })
      .populate("blueprint")
      .sort({ createdAt: -1 });

    const blueprints = projects
      .filter((p) => p.blueprint)
      .map((p) => ({
        projectId: p._id,
        projectName: p.name,
        blueprint: p.blueprint,
      }));

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

/**
 * @desc    Get a blueprint by projectId
 * @route   GET /api/v1/blueprint/:projectId
 * @access  Private
 */
exports.getBlueprintByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.userId;

    // 1️⃣ Validate projectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid project ID format.",
      });
    }

    // 2️⃣ Fetch project with populated blueprint
    const project = await Project.findOne({ _id: projectId, owner: userId })
      .populate("blueprint");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "❌ Project not found or not owned by user.",
      });
    }

    // 3️⃣ Return existing blueprint or null if not generated yet
    return res.status(200).json({
      success: true,
      message: project.blueprint
        ? "✅ Blueprint fetched successfully."
        : "ℹ️ No blueprint generated yet for this project.",
      blueprint: project.blueprint || null,
    });
  } catch (error) {
    console.error("❌ Server Error (Fetching Blueprint by ProjectId):", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blueprint.",
    });
  }
};
