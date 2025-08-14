//blueprintBuilder.js

const { buildBlueprintPrompt } = require("../utils/promptGenerator"); // Correct import
const { getAIResponse } = require("./openaiService"); // DeepSeek AI wrapper
const { getNextVersion } = require("../utils/versionUtils");

/**
 * Generates a complete project blueprint using AI.
 * @param {string} projectName - Name of the project
 * @param {string} ideaDescription - Short description of the project idea
 * @returns {Object} - The generated blueprint object
 */
const generate = async (projectName, ideaDescription) => {
  try {
    // 1️⃣ Build AI prompt using user's input
    const prompt = buildBlueprintPrompt({
      idea: `${projectName}: ${ideaDescription}`,
      experience: "beginner", // Can be dynamic later
      goal: "Build a scalable, secure, full-stack app"
    });

    // 2️⃣ Get AI-generated content from groq
    const aiContent = await getAIResponse(prompt);

    if (!aiContent) {
      throw new Error("AI did not return a response.");
    }

    // 3️⃣ Convert AI output into version stages (Beta → V1 → V2…)
    const versionStages = getNextVersion(aiContent);

    // 4️⃣ Return structured blueprint
    return {
      projectName,
      ideaDescription,
      promptUsed: prompt,
      content: aiContent,
      versions: versionStages,
      createdAt: new Date()
    };
  } catch (error) {
    console.error("🚨 Blueprint Generation Failed:", {
      error: error.message,
      stack: error.stack,
      project: projectName
    });
    throw new Error(`Blueprint generation failed: ${error.message}`);
  }
};

module.exports = { generate };
