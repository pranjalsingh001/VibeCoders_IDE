// utils/promptGenerator.js

/**
 * Builds a prompt string for GPT to generate project blueprints.
 * @param {Object} options - Information for generating blueprint
 * @param {string} options.idea - Raw project idea from user
 * @param {string} options.experience - User experience level (e.g., "beginner", "intermediate")
 * @param {string} options.goal - What the user wants to achieve
 * @returns {string} - A well-crafted GPT prompt
 */

function buildBlueprintPrompt({ idea, experience, goal }) {
  return `
You are an expert software architect helping a ${experience} developer.

Their idea is:
"${idea}"

They want to achieve:
"${goal}"

Your job is to break down this idea into:
- Step-by-step development roadmap
- Recommended tech stack
- System architecture diagram
- Project folder structure
- Key files with explanation
- API structure (if applicable)
- Any security, scaling, or DevOps advice
- Learning resources for missing skills

Use clear, beginner-friendly language if the experience is beginner. Be specific and structured in your response.
`;
}

module.exports = { buildBlueprintPrompt };
