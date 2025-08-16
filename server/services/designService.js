// services/designService.js
// Generates HLD and LLD docs via AI and persists through the controller.
// Uses your existing DeepSeek-backed getAIResponse(prompt).

const { getAIResponse } = require("./openaiService");

/**
 * Build a strong HLD prompt.
 * Keep it deterministic, structured, and beginner-friendly.
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

Return in **Markdown**. Be concise but complete.
`;
}

/**
 * Build a strong LLD prompt given an accepted HLD.
 */
function buildLldPrompt({ projectName, hldMarkdown, techPref }) {
  return `
You are a senior backend lead. Produce a **Low-Level Design (LLD)** for the approved HLD.

Project: ${projectName}
Tech preferences (optional): ${techPref || "not specified"}

Approved HLD:
---
${hldMarkdown}
---

LLD MUST include:

1) Module-by-Module Design (for each component/service)
   - Purpose
   - Public interfaces (function signatures / routes)
   - Data contracts (request/response DTOs)
   - Error handling strategy
2) Database Schema (DDL-style tables/collections; indexes; constraints)
3) Caching Plan (what keys, TTLs, invalidation)
4) Messaging/Queue Contracts (topics/queues, payload shape, retry/DLQ)
5) Config & Secrets (env variables and sample .env)
6) Folder Structure (backend + frontend if applicable)
7) File List with Purpose (e.g., routes/tweetRoutes.js, models/Tweet.js)
8) Pseudocode or Code Stubs (for critical flows)
9) Security Details (RBAC/ABAC, input validation, rate limits)
10) Testing Strategy (unit + integration; what to mock; sample tests)

Return in **Markdown**.
`;
}

async function generateHLD({ projectName, ideaDescription, techPref }) {
  const prompt = buildHldPrompt({ projectName, ideaDescription, techPref });
  const content = await getAIResponse(prompt);
  return { promptUsed: prompt, content };
}

async function generateLLD({ projectName, hldMarkdown, techPref }) {
  const prompt = buildLldPrompt({ projectName, hldMarkdown, techPref });
  const content = await getAIResponse(prompt);
  return { promptUsed: prompt, content };
}

module.exports = { generateHLD, generateLLD };
