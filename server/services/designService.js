// services/designService.js
// Generates HLD and LLD docs via AI and persists through the controller.
// Uses your existing DeepSeek-backed getAIResponse(prompt).

const { getAIResponse } = require("./openaiService");
const { buildHldPrompt, buildLldPrompt } = require("../utils/promptGenerator");

async function generateHLD({ projectName, ideaDescription, techPref }) {
  const prompt = buildHldPrompt({ projectName, ideaDescription, techPref });
  const content = await getAIResponse(prompt);
  let parsed;
  try {
    // Try to parse directly
    parsed = JSON.parse(content.trim());
  } catch (err) {
    // If direct parse fails, try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error('Failed to parse HLD JSON response: ' + innerErr.message);
      }
    } else {
      throw new Error('Failed to parse HLD JSON response: no JSON found in response');
    }
  }
  // Clean the architecture string to remove any markdown formatting
  if (parsed.architecture) {
    parsed.architecture = parsed.architecture.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
  }
  return { promptUsed: prompt, ...parsed };
}

async function generateLLD({ projectName, hldMarkdown, techPref }) {
  const prompt = buildLldPrompt({ projectName, hldMarkdown, techPref });
  const content = await getAIResponse(prompt);
  let parsed;
  try {
    // Try to parse directly
    parsed = JSON.parse(content.trim());
  } catch (err) {
    // If direct parse fails, try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (innerErr) {
        throw new Error('Failed to parse LLD JSON response: ' + innerErr.message);
      }
    } else {
      throw new Error('Failed to parse LLD JSON response: no JSON found in response');
    }
  }
  return { promptUsed: prompt, ...parsed };
}

module.exports = { generateHLD, generateLLD };
