// controllers/planningController.js
const { getClarifyingQuestions } = require("../services/planningService");
const DesignDoc = require("../models/DesignDoc");
const Project = require("../models/Project");

// POST /api/v1/planning/clarify
exports.getClarification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, projectName, ideaDescription } = req.body;

    if (!projectId && (!projectName || !ideaDescription)) {
      return res.status(400).json({ success: false, message: "Provide projectId or projectName+ideaDescription." });
    }

    // If projectId not provided, create a new Project shell
    let project = projectId ? await Project.findOne({ _id: projectId, owner: userId }) : null;
    if (!project) {
      project = await Project.create({
        owner: userId,
        name: projectName,
        idea: ideaDescription,
        status: "clarifying",
      });
    }

    const { promptUsed, questions } = await getClarifyingQuestions({
      projectName: project.name,
      ideaDescription: project.idea
    });

    // Save as a design doc (type: "clarification-questions")
    const doc = await DesignDoc.create({
      project: project._id,
      type: "clarification-questions",
      content: questions,
      promptUsed
    });

    return res.status(200).json({ success: true, projectId: project._id, questions, designDocId: doc._id });
  } catch (err) {
    console.error("Clarification Error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate clarifying questions." });
  }
};

// POST /api/v1/planning/clarify/answer
exports.submitClarificationAnswers = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, answers } = req.body;

    if (!projectId || !answers) {
      return res.status(400).json({ success: false, message: "ProjectId and answers are required." });
    }

    // Save answers into DesignDoc
    const doc = await DesignDoc.create({
      project: projectId,
      type: "clarification-answers",
      content: answers,
    });

    // Update project status to "planned"
    await Project.findByIdAndUpdate(projectId, { status: "planned" });

    res.status(200).json({ success: true, message: "Clarification answers saved.", docId: doc._id });
  } catch (err) {
    console.error("Clarification Answers Error:", err);
    res.status(500).json({ success: false, message: "Failed to save clarification answers." });
  }
};

// GET /api/v1/planning/docs?projectId=...
exports.getPlanningDocs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId } = req.query;

    if (!projectId) return res.status(400).json({ success: false, message: "projectId is required" });

    // Ensure the user owns the project
    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const questionsDoc = await DesignDoc.findOne({ project: projectId, type: "clarification-questions" }).sort({ createdAt: -1 });
    const answersDoc = await DesignDoc.findOne({ project: projectId, type: "clarification-answers" }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      questions: questionsDoc ? questionsDoc.content : null,
      answers: answersDoc ? answersDoc.content : null
    });
  } catch (err) {
    console.error("GetPlanningDocs Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch planning docs" });
  }
};
