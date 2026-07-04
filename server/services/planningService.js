// services/planning/planningService.js
// Handles the pre-blueprint "clarification" step.

const { getAIResponse } = require("./openaiService");
const { clarifyingPrompt } = require("../utils/promptGenerator");

/**
 * Fetch clarifying questions from AI
 */
async function getClarifyingQuestions({ projectName, ideaDescription }) {
  const prompt = clarifyingPrompt({ projectName, ideaDescription });

  try {
    const content = await getAIResponse(prompt);
    return { promptUsed: prompt, questions: content };
  } catch (err) {
    console.error("PlanningService Error:", err.message);
    throw new Error("Failed to get clarifying questions from AI.");
  }
}

/**
 * Generate planning output (clarifying questions) for workflow.
 * @param {Object} project - Mongoose project document
 * @returns {Object} Planning result with questions array
 */
async function generate(project) {
  const { name: projectName, idea: ideaDescription } = project;
  const result = await getClarifyingQuestions({ projectName, ideaDescription });
  
  // Split questions into array, assuming numbered list
  const questions = result.questions
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /^\d+\.\s/.test(line))
    .map(line => line.replace(/^\d+\.\s*/, '').trim());

  return {
    questions,
    promptUsed: result.promptUsed,
    createdAt: new Date()
  };
}



module.exports = { getClarifyingQuestions, generate };
