// blueprintBuilder.js
const { generatePrompt } = require("../utils/promptGenerator");
const { getAIResponse } = require("./openaiService");
const { generateVersionStages } = require("../utils/versionUtils");

/**
 * Builds a complete blueprint for a user project idea.
 * @param {string} idea - The user's raw project idea.
 */
const buildBlueprint = async (idea) => {
  const prompt = generatePrompt(idea);
  const aiContent = await getAIResponse(prompt);

  const versionStages = generateVersionStages(aiContent);

  return {
    promptUsed: prompt,
    content: aiContent,
    versions: versionStages,
  };
};

module.exports = { buildBlueprint };
