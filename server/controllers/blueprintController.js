const Blueprint = require("../models/blueprint");
const blueprintBuilder = require("../services/blueprintBuilder");

// @desc   Generate project blueprint from idea
// @route  POST /api/blueprint/generate
// @access Private
exports.generateBlueprint = async (req, res) => {
  try {
    const userId = req.user.userId; // From auth middleware
    const { projectName, ideaDescription } = req.body;

    // Validate input
    if (!projectName || !ideaDescription) {
      return res.status(400).json({ message: "Project name and idea are required." });
    }

    // Use blueprintBuilder service to get the plan (GPT-generated)
    const blueprint = await blueprintBuilder.generate(projectName, ideaDescription);

    // Save to database
    const savedBlueprint = await Blueprint.create({
      user: userId,
      projectName,
      ideaDescription,
      generatedBlueprint: blueprint,
    });

    res.status(201).json({ blueprint: savedBlueprint });
  } catch (error) {
    console.error("Blueprint Generation Error:", error);
    res.status(500).json({ message: "Failed to generate blueprint." });
  }
};
