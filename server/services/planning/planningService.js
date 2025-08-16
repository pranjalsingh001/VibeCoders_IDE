// services/planning/planningService.js
// Handles the pre-blueprint "clarification" step.

const { getAIResponse } = require("../openaiService");

/**
 * Builds a prompt asking clarifying questions before blueprinting.
 * @param {Object} options
 * @param {string} options.projectName
 * @param {string} options.ideaDescription
 * @returns {string} - AI prompt
 */
function clarifyingPrompt({ projectName, ideaDescription }) {
  return `
You are a helpful product architect.

The user said they want to build: "${projectName}"

Idea description:
"${ideaDescription}"

Before planning anything, ask 5–8 short clarifying questions.
Focus on:
1. Target users
2. Core MVP features vs. nice-to-have
3. Authentication/roles
4. Performance & scaling needs
5. Tech preferences (Next.js, Node.js, etc.)
6. Database choice
7. Deployment preference (Vercel, AWS, Docker)
8. Budget/constraints

Return ONLY the numbered questions (no extra text).
`;
}

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



module.exports = { getClarifyingQuestions };
