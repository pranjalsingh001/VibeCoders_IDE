// controllers/designController.js
// Persists HLD/LLD docs to DesignDoc model (versioned), linked to a Project.

const Project = require("../models/Project");
const DesignDoc = require("../models/DesignDoc");
const { generateHLD, generateLLD } = require("../services/designService");

/**
 * POST /api/v1/design/hld
 * body: { projectId, projectName?, ideaDescription?, techPref? }
 * If projectId is missing, create one from projectName + ideaDescription.
 */
exports.createHLD = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { projectId, projectName, ideaDescription, techPref } = req.body;

    // Load or create project shell
    let project = null;
    if (projectId) {
      project = await Project.findOne({ _id: projectId, owner: userId });
      if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    } else {
      if (!projectName || !ideaDescription) {
        return res.status(400).json({ success: false, message: "projectName and ideaDescription required if no projectId" });
      }
      project = await Project.create({
        owner: userId,
        name: projectName,
        idea: ideaDescription,
        status: "planned",
      });
    }

    // Use stored values if missing in request
    projectName = projectName || project.name;
    ideaDescription = ideaDescription || project.idea;

    // Generate HLD
    const { promptUsed, content } = await generateHLD({ projectName, ideaDescription, techPref });

    // Save HLD doc
    const hldDoc = await DesignDoc.create({
      project: project._id,
      type: "HLD",
      content,
      promptUsed,
      versionTag: "v1"
    });

    // Update project status
    project.status = "planned";
    await project.save();

    return res.status(201).json({ success: true, projectId: project._id, designDocId: hldDoc._id, hld: content });
  } catch (err) {
    console.error("HLD Error:", err);
    return res.status(500).json({ success: false, message: "Failed to create HLD" });
  }
};

/**
 * POST /api/v1/design/lld
 * body: { projectId, techPref? }
 * Requires an existing HLD in DesignDoc.
 */
exports.createLLD = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, techPref } = req.body;

    if (!projectId) return res.status(400).json({ success: false, message: "projectId is required" });

    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // Fetch latest HLD for this project
    const hld = await DesignDoc.findOne({ project: project._id, type: "HLD" }).sort({ createdAt: -1 });
    if (!hld) return res.status(400).json({ success: false, message: "No HLD found for this project. Create HLD first." });

    // Generate LLD based on HLD
    const { promptUsed, content } = await generateLLD({
      projectName: project.name,
      hldMarkdown: hld.content,
      techPref,
    });

    const lldDoc = await DesignDoc.create({
      project: project._id,
      type: "LLD",
      content,
      promptUsed,
      versionTag: "v1"
    });

    return res.status(201).json({ success: true, projectId: project._id, designDocId: lldDoc._id, lld: content });
  } catch (err) {
    console.error("LLD Error:", err);
    return res.status(500).json({ success: false, message: "Failed to create LLD" });
  }
};

/**
 * GET /api/v1/design/docs?projectId=...&type=HLD|LLD
 */
exports.getDesignDocs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, type } = req.query;

    if (!projectId) return res.status(400).json({ success: false, message: "projectId is required" });

    // Ensure the user owns the project
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const filter = { project: projectId };
    if (type) filter.type = type;

    const docs = await DesignDoc.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: docs.length, docs });
  } catch (err) {
    console.error("GetDesignDocs Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch design docs" });
  }
};
