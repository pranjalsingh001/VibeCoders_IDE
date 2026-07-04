// services/blueprintBuilder.js
// -----------------------------
// Generates a structured project blueprint using AI (DeepSeek/OpenAI)
// and parses it into fields for frontend consumption (BlueprintPage.tsx).

const { buildBlueprintPrompt } = require("../utils/promptGenerator");
const { getAIResponse } = require("./openaiService");
const { getNextVersion } = require("../utils/versionUtils");

/**
 * Parse AI-generated blueprint content into structured fields.
 * @param {string} content - Raw AI response
 * @returns {Object} Parsed blueprint sections
 */
const parseBlueprint = (content) => {
  const sections = {};
  const headerRegex = /^##\s*(.+?)$/gm;
  const matches = [];
  let match;

  // First, collect all header matches
  while ((match = headerRegex.exec(content)) !== null) {
    matches.push({
      header: match[1].trim().toLowerCase().replace(/[^a-z0-9\s]/g, ''),
      start: match.index + match[0].length,
      index: match.index
    });
  }

  // Now extract content between headers
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    
    const start = currentMatch.start;
    const end = nextMatch ? nextMatch.index : content.length;
    
    const sectionContent = content.substring(start, end).trim();
    sections[currentMatch.header] = sectionContent;
  }

  // No need for remaining content handling since we process all sections above

  // Helper to parse bullet or numbered lists
  const parseList = (text) => {
    if (!text) return [];
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('- ') || line.startsWith('* ') || /^\d+\./.test(line))
      .map(line => {
        if (/^\d+\./.test(line)) {
          return line.replace(/^\d+\.\s*/, '').trim();
        }
        return line.replace(/^-?\s*[\-*]\s*/, '').trim();
      });
  };

  // Map sections to required fields
  const overview = sections['overview'] || '';
  const components = parseList(sections['components'] || '');
  const techStack = parseList(sections['recommended tech stack'] || '');
  const folderStructure = sections['project folder structure'] || null;
  let architecture = sections['system architecture diagram'] || null;
  const apiStructure = sections['api structure'] || null;
  const roadmapText = sections['stepbystep development roadmap'] || '';
  const keyFilesText = sections['key files with explanation'] || '';
  const roadmap = parseList(roadmapText);
  const keyFiles = parseList(keyFilesText);
  const learningResources = parseList(sections['learning resources for missing skills'] || '');
  let securityAdvice = sections['security scaling and devops advice'] || '';
  if (securityAdvice) {
    if (architecture) {
      architecture += '\n\n## Security, Scaling, and DevOps Advice\n' + securityAdvice;
    } else {
      architecture = '## Security, Scaling, and DevOps Advice\n' + securityAdvice;
    }
  }
  architecture = architecture ? architecture.trim() : null;
  const features = [...roadmap, ...keyFiles]; // Combine for backward compatibility
  const diagrams = {
    architecture: sections['system architecture diagram'] || null,
    // Add more if other diagrams are described
  };

  return {
    overview,
    components,
    architecture,
    techStack,
    features,
    diagrams,
    folderStructure,
    apiStructure,
    roadmap,
    keyFiles,
    learningResources,
    securityAdvice: securityAdvice.trim() || null,
  };
};
/**
 * Generate an AI-powered project blueprint
 * @param {Object} options
 * @param {string} options.projectName - Name of the project
 * @param {string} options.ideaDescription - Raw idea/description of project
 * @param {string} [options.answers] - Clarification answers (if any)
 * @param {string} [options.experience="beginner"] - Developer experience level
 * @param {string} [options.goal="Build a scalable, secure, full-stack app"] - Goal
 * @returns {Object} Structured blueprint ready for database & frontend
 */
const generate = async ({
  projectName,
  ideaDescription,
  answers,
  experience = "beginner",
  goal = "Build a scalable, secure, full-stack app",
}) => {
  try {
    // 1️⃣ Combine clarifications with idea description
    const clarifications = answers ? `\nClarifications:\n${answers}` : "";

    // 2️⃣ Build the AI prompt
    const prompt = buildBlueprintPrompt({
      idea: `${projectName}: ${ideaDescription}${clarifications}`,
      experience,
      goal,
    });

    // 3️⃣ Get AI-generated content
    const aiContent = await getAIResponse(prompt);
    if (!aiContent) throw new Error("AI did not return a valid response.");

    // 4️⃣ Parse AI content into structured fields
    const parsed = parseBlueprint(aiContent);

    // 5️⃣ Generate version metadata (future iterations)
    const versionStages = getNextVersion(aiContent);

    // 6️⃣ Return structured object
    return {
      overview: parsed.overview || '',
      components: parsed.components || [],
      projectName,
      ideaDescription,
      clarifications: answers || "",
      promptUsed: prompt,
      raw: aiContent, // Keep full original AI output
      architecture: parsed.architecture || null,
      techStack: parsed.techStack || null,
      features: parsed.features || [],
      diagrams: parsed.diagrams || {},
      folderStructure: parsed.folderStructure || null,
      versions: versionStages,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("🚨 Blueprint Generation Failed:", {
      error: error.message,
      stack: error.stack,
      project: projectName,
    });
    throw new Error("⚠️ AI service failed to generate blueprint. Please try again later.");
  }
};

module.exports = { generate };
