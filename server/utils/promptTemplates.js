// utils/promptTemplates.js
const PROMPT_TEMPLATES = {
  BLUEPRINT: `You are an expert software architect helping a {{experience}} developer.

Project: {{projectName}}
Idea: {{ideaDescription}}
Clarifications: {{clarifications}}
Goal: {{goal}}

Generate a comprehensive project blueprint including:

1. ARCHITECTURE OVERVIEW
   - System components and interactions
   - Technology recommendations with justification
   - Deployment strategy

2. CORE FEATURES (MVP)
   - Essential functionality with priorities
   - User stories and acceptance criteria

3. DATA MODEL
   - Entity relationships
   - Database schema recommendations
   - API endpoints structure

4. SECURITY CONSIDERATIONS
   - Authentication/authorization strategy
   - Data protection measures
   - Compliance requirements

5. SCALABILITY PLAN
   - Performance optimization strategies
   - Horizontal/vertical scaling approaches
   - Monitoring and logging

6. DEVELOPMENT ROADMAP
   - Phase 1: MVP (2-4 weeks)
   - Phase 2: Enhancements (4-8 weeks)
   - Phase 3: Advanced features (8+ weeks)

7. FOLDER STRUCTURE
   - Recommended project organization
   - Key files and their purposes

Return in clear, structured markdown format.`,

  HLD: `You are a senior software architect. Create a High-Level Design for:

Project: {{projectName}}
Idea: {{ideaDescription}}
Blueprint: {{blueprint}}
Tech Preferences: {{techPref}}

HLD MUST include:

1. SYSTEM ARCHITECTURE DIAGRAM (Mermaid)
2. COMPONENT BREAKDOWN
   - Frontend: Framework, state management, UI components
   - Backend: Framework, API structure, middleware
   - Database: Type, schema, ORM/ODM
   - Infrastructure: Hosting, CDN, caching
3. API DESIGN
   - REST/GraphQL endpoints
   - Request/response formats
   - Error handling
4. DATA FLOW
   - User interactions → API → Database
   - Real-time communication if needed
5. SECURITY ARCHITECTURE
   - Authentication flow
   - Authorization rules
   - Data encryption
6. DEPLOYMENT STRATEGY
   - CI/CD pipeline
   - Environment setup
   - Monitoring and alerts

Return in markdown with clear section headers.`,

  LLD: `You are a senior backend lead. Create Low-Level Design from:

Project: {{projectName}}
HLD: {{hldMarkdown}}
Tech Preferences: {{techPref}}

LLD MUST include:

1. DETAILED COMPONENT DESIGN
   - Module interfaces and contracts
   - Class diagrams and relationships
   - Data transfer objects
2. DATABASE SCHEMA
   - Tables/collections with fields
   - Indexes and constraints
   - Relationships and foreign keys
3. API SPECIFICATION
   - Endpoint details with parameters
   - Response formats and status codes
   - Validation rules
4. BUSINESS LOGIC
   - Algorithm descriptions
   - Error handling strategies
   - Transaction management
5. CONFIGURATION MANAGEMENT
   - Environment variables
   - Configuration files
   - Secret management
6. TESTING STRATEGY
   - Unit test coverage
   - Integration test scenarios
   - Mocking strategies

Return in structured markdown format.`,

  PLAN: `You are a senior software engineer. Convert this LLD into a file plan:

Project: {{projectName}}
LLD: {{lldMarkdown}}

Generate a JSON array of file specifications with:
- path: File path relative to project root
- purpose: Clear description of file's role
- language: Programming language
- priority: High/Medium/Low
- dependencies: Files this depends on

Format:
{
  "files": [
    {
      "path": "backend/server.js",
      "purpose": "Express server entry point",
      "language": "javascript",
      "priority": "High",
      "dependencies": []
    }
  ]
}

Return ONLY valid JSON between BEGIN_JSON and END_JSON markers.`,

  FILE_CONTENT: `You are a senior software engineer writing production-ready code.

Project: {{projectName}}
File: {{filePath}}
Purpose: {{purpose}}
Language: {{language}}

LLD Reference:
{{lldMarkdown}}

Neighbor Files:
{{neighborFiles}}

INSTRUCTIONS:
1. Write complete, functional code - no placeholders or TODO comments
2. Include all necessary imports at the top
3. Add proper error handling and validation
4. Use environment variables for configuration (never hardcode secrets)
5. Add comprehensive comments explaining complex logic
6. Follow {{language}} best practices and conventions
7. Make code secure, scalable, and maintainable
8. If this is a server file, include proper middleware setup
9. If this is a model file, include proper validation and methods
10. If this is a config file, include all necessary settings

IMPORTANT:
- Return ONLY the raw code content
- No markdown formatting or code blocks
- No explanations or comments about the response
- Code must be immediately runnable/usable

Example for JavaScript:
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;`
};

module.exports = { PROMPT_TEMPLATES };