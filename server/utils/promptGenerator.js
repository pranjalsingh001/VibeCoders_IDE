const { PROMPT_TEMPLATES } = require('./promptTemplates');

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

Your job is to break down this idea into the following sections. Use Markdown headers (## Section Name) for each section exactly as listed below. Be specific, structured, and use bullet points or code blocks where appropriate. Use clear, beginner-friendly language if the experience is beginner.

## Overview
Provide a high-level summary of the project, including main goals, target users, and key technologies.

## Components
List the main system components (e.g., frontend, backend, database) as a bulleted list, with a brief description of each.

## Step-by-Step Development Roadmap
Provide a numbered list of steps to build the project.

## Recommended Tech Stack
List the frontend, backend, database, and other tools in bullet points.

## System Architecture Diagram
Describe the high-level architecture in a simple ASCII diagram using code block (\`\`\`).

## Project Folder Structure
Show the folder structure in a code block (\`\`\`bash) with tree-like format.

## Key Files with Explanation
List important files and briefly explain their purpose in bullet points.

## API Structure
If applicable, describe RESTful endpoints in a code block (\`\`\`).

## Security, Scaling, and DevOps Advice
Provide advice in bullet points.

## Learning Resources for Missing Skills
List helpful tutorials or docs in bullet points.
`;
}

/**
 * Generates a prompt from a template by replacing placeholders.
 * @param {string} templateKey - Key from PROMPT_TEMPLATES
 * @param {Object} replacements - Object with replacement values
 * @returns {string} - The generated prompt
 */
function generatePrompt(templateKey, replacements = {}) {
  let template = PROMPT_TEMPLATES[templateKey];
  if (!template) throw new Error(`Template ${templateKey} not found`);
  return template.replace(/\{\{(\w+)\}\}/g, (match, p1) => replacements[p1] || match);
}

/**
 * Builds a prompt for generating HLD.
 */
function buildHldPrompt({ projectName, ideaDescription, techPref }) {
  return `
You are a senior software architect. Produce a **High-Level Design (HLD)** for the following project.

Project Name: ${projectName}
Idea: ${ideaDescription}
Tech preferences (optional): ${techPref || "not specified"}

HLD MUST be clear and beginner-friendly and include these sections:

1) System Overview
2) Key Requirements
   - Functional (bullet points)
   - Non-Functional (availability, scalability, security, cost, latency targets)
3) Architecture Diagram (Mermaid code block). Include client, API gateway, services, DBs, queues, cache, CDN, object storage, 3rd-party APIs.
   Example:
   \`\`\`mermaid
   flowchart LR
     Client --> API
     API --> SVC1
     SVC1 --> DB[(PostgreSQL)]
     API --> Cache[(Redis)]
     API --> Queue[(RabbitMQ)]
   \`\`\`
4) Components & Responsibilities (each service with clear purpose)
5) Data Model (key entities & relationships; simple ERD or tables list)
6) API Surface (critical endpoints only; method + path + brief purpose)
7) Infra & Deployment (hosting, containerization, CI/CD)
8) Security (authn/z, OWASP items, secrets, rate-limits, logging)
9) Scalability Approach (horizontal scaling, partitioning, caching, backpressure)
10) Observability (logs, metrics, traces, dashboards)
11) Risks & Trade-offs (with mitigation)

Return ONLY a valid JSON object with the following keys (no additional text, explanations, or markdown formatting):
- "systemOverview": string
- "keyRequirements": object with "functional": array of strings, "nonFunctional": array of strings
- "architecture": string (the Mermaid code for the diagram, without any markdown code block formatting like \`\`\`mermaid)
- "components": string
- "dataFlow": string (data model description)
- "apiSurface": string
- "infraDeployment": string
- "security": string
- "scalability": string
- "observability": string
- "risks": string

Be concise but complete.
`;
}

/**
 * Builds a prompt for generating LLD.
 */
function buildLldPrompt({ projectName, hldMarkdown, techPref }) {
  return `
You are a senior backend lead. Produce a **Low-Level Design (LLD)** for the approved HLD.

CRITICAL: This is for project "${projectName}" - ensure all designs, models, and APIs are specific to this project's domain and requirements. DO NOT use generic Twitter/social media examples.

Project: ${projectName}
Tech preferences (optional): ${techPref || "not specified"}

Approved HLD:
---
${hldMarkdown}
---

🚫 CRITICAL: Do NOT use Twitter, social media, or generic social networking examples. This is for "${projectName}" specifically.

LLD MUST include:

1) Module-by-Module Design (for each component/service specific to ${projectName})
   - Purpose (related to ${projectName} domain)
   - Public interfaces (function signatures / routes for ${projectName} features)
   - Data contracts (request/response DTOs for ${projectName} entities)
   - Error handling strategy
2) Database Schema (DDL-style tables/collections for ${projectName} entities; indexes; constraints)
3) Caching Plan (what keys, TTLs, invalidation for ${projectName} data)
4) Messaging/Queue Contracts (topics/queues, payload shape, retry/DLQ for ${projectName})
5) Config & Secrets (env variables and sample .env for ${projectName})
6) Folder Structure (backend + frontend for ${projectName} application)
7) File List with Purpose (specific to ${projectName} domain - e.g., for todo app: routes/taskRoutes.js, models/Task.js; for e-commerce: routes/productRoutes.js, models/Product.js)
8) Pseudocode or Code Stubs (for critical flows in ${projectName})
9) Security Details (RBAC/ABAC, input validation, rate limits for ${projectName})
10) Testing Strategy (unit + integration; what to mock; sample tests for ${projectName})

Return ONLY a valid JSON object with the following keys (no additional text, explanations, or markdown formatting):
- "detailedComponents": array of objects, each with "name": string, "purpose": string, "interfaces": array of strings, "dataContracts": string, "errorHandling": string
- "databaseSchema": string
- "cachingPlan": string
- "messagingContracts": string
- "configSecrets": string
- "folderStructure": string
- "fileList": array of objects, each with "path": string, "purpose": string
- "pseudocodeStubs": string
- "securityDetails": string
- "testingStrategy": string

Be concise but complete.
`;
}

/**
 * Builds a prompt for generating plan.
 */
function buildPlanPrompt({ projectName, lldMarkdown, projectIdea = '', projectDescription = '' }) {
  return `
You are a senior software engineer. Convert the following **LLD** into a concrete minimal runnable file plan for the project "${projectName}".

🚫 ABSOLUTELY FORBIDDEN: 
- NO files named: Tweet.js, TweetRoutes.js, TweetService.js, tweetRoutes.js, tweetService.js
- NO purposes mentioning: tweets, twitter, social media, posts, follows, likes, retweets
- NO social networking features of any kind

✅ REQUIRED: This is "${projectName}" - Generate files specific to this project's actual domain and requirements.

🎯 PROJECT ANALYSIS: Look at "${projectName}" and determine what type of application this is:
- If it contains "todo" or "task" → Generate Task.js, TaskRoutes.js, TaskService.js
- If it contains "shop" or "store" → Generate Product.js, ProductRoutes.js, ProductService.js  
- If it contains "blog" → Generate Article.js, ArticleRoutes.js, ArticleService.js
- Otherwise → Generate appropriate domain-specific files

Project: ${projectName}
${projectIdea ? `Project Idea: ${projectIdea}` : ''}
${projectDescription ? `Project Description: ${projectDescription}` : ''}

LLD (reference):
---
${lldMarkdown}
---

CRITICAL RULES:
1. Read the LLD carefully to understand the ACTUAL project type (todo list, e-commerce, blog, etc.)
2. Generate files that match the project's SPECIFIC domain (e.g., Todo.js for todo app, Product.js for e-commerce)
3. 🚫 NEVER use these forbidden terms in file paths or purposes: tweet, twitter, social, post, follow, like, retweet
4. ✅ Use appropriate domain terms (e.g., for todo list: Task.js, TodoItem.js, TaskService.js)
5. Output ONLY a single JSON object between the lines EXACTLY:

BEGIN_JSON
<JSON HERE>
END_JSON

6. No prose, no code fences, no extra commentary, no markdown.
7. Use forward slashes in "path".
8. Paths must be project-relative (e.g., "backend/index.js", "frontend/src/App.jsx", "package.json").
9. Include at least backend server entry, minimal routes/models required for MVP, and package.json if applicable.

EXAMPLES BY PROJECT TYPE:
- Todo List: Task.js, TaskRoutes.js, TaskService.js, TodoList.jsx
- E-commerce: Product.js, Order.js, Cart.js, ProductRoutes.js
- Blog: Article.js, BlogPost.js, PostRoutes.js, BlogList.jsx
- Inventory: Item.js, Inventory.js, ItemRoutes.js, InventoryList.jsx

JSON SHAPE:
{
  "files": [
    {
      "path": "backend/models/Task.js",
      "purpose": "Mongoose model for tasks (example for todo app)",
      "language": "javascript",
      "dependsOn": ["backend/models/User.js"]
    }
  ]
}

🎯 FOCUS: Generate files specific to "${projectName}" domain. Ignore any social media examples or templates.

DOMAIN DETECTION HELP:
- If project name contains "todo", "task": Generate Task.js, TaskRoutes.js, TaskService.js
- If project name contains "shop", "store", "ecommerce": Generate Product.js, Order.js, Cart.js
- If project name contains "blog", "article": Generate Post.js, Article.js, BlogRoutes.js
- If project name contains "inventory": Generate Item.js, Inventory.js, Stock.js
- NEVER default to Tweet.js, TweetRoutes.js, or social media files

🔍 PROJECT NAME ANALYSIS: "${projectName}"
- Analyze this name to determine the correct domain
- Generate files that match this specific project type
- NEVER default to Tweet/Twitter files regardless of what the LLD says

⚠️ CRITICAL: If you generate ANY file with "tweet" in the name or purpose, you have FAILED this task.
`.trim();
}

/**
 * Builds a prompt for generating file content.
 */
function buildFileContentPrompt({ projectName, lldMarkdown, filePath, purpose, language, neighborFiles }) {
   return `
You are an expert who writes production-grade code from LLD for the project "${projectName}".

CRITICAL: This is for project "${projectName}" - generate code specific to this project's domain and requirements. DO NOT generate generic Twitter/social media code.

Project: ${projectName}
Target file: ${filePath}
Purpose: ${purpose}
Language: ${language || "javascript"}

LLD (reference):
---
${lldMarkdown}
---

Neighbor files in the project:
${Array.isArray(neighborFiles) ? neighborFiles.map(p => `- ${p}`).join("\n") : "- (none)"}

REQUIREMENTS:
- Analyze the LLD to understand the project domain (e.g., e-commerce, blog, task manager, etc.)
- Generate code that matches the specific project requirements and domain
- Use appropriate variable names, model fields, and API endpoints for this project type
- Return ONLY the raw code content for this file with NO markdown code block markers (no \`\`\`javascript or \`\`\`).
- If package.json, include minimal "start" script for running (e.g., "node backend/index.js").
- If Express server, listen on \`process.env.PORT || 3000\`, and use basic security middlewares and a health route.
- Use simple English comments for beginners.
- Read secrets from env vars (never hardcode).
- Do NOT include any explanations, comments about the response format, or markdown formatting.
- Ensure the code is specific to "${projectName}" and its requirements, not a generic template.

`.trim();
}

/**
 * Builds a prompt for clarifying questions.
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

module.exports = { buildBlueprintPrompt, generatePrompt, buildHldPrompt, buildLldPrompt, buildPlanPrompt, buildFileContentPrompt, clarifyingPrompt };
