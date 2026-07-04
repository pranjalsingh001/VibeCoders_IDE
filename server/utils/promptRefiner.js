// utils/promptRefiner.js - Utility to refine prompts based on validation failures
const { getAIResponse } = require("../services/openaiService");

/**
 * Refine a file generation prompt based on validation errors
 * @param {string} originalPrompt - The original prompt used for generation
 * @param {string} validationError - The validation error message
 * @param {object} fileSpec - The file specification
 * @returns {string} - Refined prompt
 */
async function refinePrompt(originalPrompt, validationError, fileSpec) {
  const refinementPrompt = `
The following prompt was used to generate code for a file, but the generated code failed validation:

Original Prompt:
${originalPrompt}

Validation Error:
${validationError}

File Specification:
- Path: ${fileSpec.path}
- Purpose: ${fileSpec.purpose}
- Language: ${fileSpec.language || 'javascript'}

Please provide a refined version of the original prompt that addresses the validation error.
Focus on ensuring the generated code meets the requirements and passes validation.

Provide only the refined prompt, without any additional explanation.
`;

  try {
    const refinedPrompt = await getAIResponse(refinementPrompt);
    return refinedPrompt.trim();
  } catch (error) {
    console.error('Error refining prompt:', error);
    // Return original prompt if refinement fails
    return originalPrompt;
  }
}

/**
 * Create a more specific prompt for retry attempts
 * @param {string} basePrompt - The base prompt
 * @param {number} attemptNumber - Current attempt number
 * @param {string} previousError - Previous error message
 * @returns {string} - Enhanced prompt for retry
 */
function createRetryPrompt(basePrompt, attemptNumber, previousError) {
  const retryInstructions = `
This is attempt #${attemptNumber} to generate this file. The previous attempt failed with error: ${previousError}

Please ensure the generated code:
- Is syntactically correct
- Contains all required exports/imports
- Follows the file specification exactly
- Does not contain placeholder or incomplete code

${basePrompt}
`;

  return retryInstructions;
}

module.exports = {
  refinePrompt,
  createRetryPrompt
};
