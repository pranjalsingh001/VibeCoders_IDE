// services/codeGenService.js
// Robust codegen: produces a file plan and per-file contents from LLD.
// Adds: sentinel markers, multi-parser fallback, retries, and schema validation.

const { getAIResponse } = require("./openaiService");
const { buildPlanPrompt, buildFileContentPrompt } = require("../utils/promptGenerator");
const { getProjectTemplate } = require("../utils/projectTemplates");
const JSON5 = require("json5");
const yaml = require("js-yaml");
const { z } = require("zod");

// ---------- Schema (Zod) ----------
const FileSpecSchema = z.object({
  path: z.string().min(1),
  purpose: z.string().min(1),
  language: z.string().optional(),       // "javascript", "typescript", "json", "markdown", etc.
  dependsOn: z.array(z.string()).optional(),
});

const PlanSchema = z.object({
  files: z.array(FileSpecSchema).min(1),
});

// ---------- Extractors ----------
function extractBetween(text, start, end) {
  const s = text.indexOf(start);
  const e = text.lastIndexOf(end);
  if (s !== -1 && e !== -1 && e > s) {
    return text.slice(s + start.length, e).trim();
  }
  return null;
}

function braceMatchSlice(text) {
  // find the largest JSON-looking region { ... }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function tryParsers(raw) {
  // Try strict JSON
  try { return JSON.parse(raw); } catch {}

  // Try JSON5 (trailing commas / comments)
  try { return JSON5.parse(raw); } catch {}

  // Try YAML
  try {
    const y = yaml.load(raw);
    if (y && typeof y === "object") return y;
  } catch {}

  return null;
}

function extractStructuredObject(aiText) {
  // 1) Sentinel block
  const sent = extractBetween(aiText, "BEGIN_JSON", "END_JSON");
  if (sent) {
    const obj = tryParsers(sent);
    if (obj) return obj;
  }

  // 2) ```json fenced block
  let m = aiText.match(/```json\s*([\s\S]*?)```/i);
  if (m) {
    const obj = tryParsers(m[1]);
    if (obj) return obj;
  }

  // 3) any fenced block
  m = aiText.match(/```[\w-]*\s*([\s\S]*?)```/);
  if (m) {
    const obj = tryParsers(m[1]);
    if (obj) return obj;
  }

  // 4) Largest { ... } region
  const slice = braceMatchSlice(aiText);
  if (slice) {
    const obj = tryParsers(slice);
    if (obj) return obj;
  }

  // 5) Last resort: try whole text
  const any = tryParsers(aiText);
  if (any) return any;

  throw new Error("No JSON block found in AI response");
}

// ---------- AI Call with Retry ----------
async function callAIForPlan(prompt, maxRetries = 1) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ai = await getAIResponse(prompt);
    try {
      const obj = extractStructuredObject(ai);
      return obj;
    } catch (err) {
      lastErr = err;
      // corrective re-prompt (tell the model it violated format)
      prompt = `
You did not follow the format. Re-output the SAME answer for the last instruction,
but ONLY the JSON object between these lines:

BEGIN_JSON
<JSON HERE>
END_JSON
`.trim();
    }
  }
  throw lastErr || new Error("Failed to parse AI response");
}

// ---------- Enhanced Throttled + Retry AI Request ----------
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function safeAIRequest(prompt, retries = 3) {
  let delay = 2000; // start with 2s
  for (let i = 0; i < retries; i++) {
    try {
      return await getAIResponse(prompt);
    } catch (err) {
      const errorMessage = err.message || '';
      const isRate = errorMessage.includes("rate_limit") || errorMessage.includes("429") || err.status === 429;
      const isAuth = errorMessage.includes("Invalid GROQ_API_KEY") || err.status === 401;
      const isNetwork = errorMessage.includes("Network connection failed") || errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND");
      const isTimeout = errorMessage.includes("timed out") || errorMessage.includes("ETIMEDOUT");

      if (isAuth) {
        // API key issues - don't retry
        console.error("🚨 Authentication error - check your GROQ_API_KEY");
        throw new Error("API key authentication failed. Please check your GROQ_API_KEY configuration.");
      } else if (isNetwork && i < retries - 1) {
        // Network issues - retry with longer delay
        console.warn(`🌐 Network error. Waiting ${delay / 1000}s before retry...`);
        await sleep(delay);
        delay = Math.min(delay * 1.5, 60 * 1000); // Cap at 1 minute
        continue;
      } else if (isTimeout && i < retries - 1) {
        // Timeout issues - retry with longer delay
        console.warn(`⏱️ Request timed out. Waiting ${delay / 1000}s before retry...`);
        await sleep(delay);
        delay = Math.min(delay * 1.5, 60 * 1000); // Cap at 1 minute
        continue;
      } else if (isRate && i < retries - 1) {
        // For rate limits, use longer delays and check if it's a daily limit
        const isDailyLimit = errorMessage.includes("tokens per day") || errorMessage.includes("TPD");
        if (isDailyLimit) {
          // Daily limit reached - wait longer (15+ minutes)
          delay = Math.max(delay, 15 * 60 * 1000); // 15 minutes minimum
          console.warn(`🚨 Daily token limit reached. Waiting ${delay / 1000 / 60} minutes before retry...`);
        } else {
          // Regular rate limit
          console.warn(`⚠️ Rate limited. Waiting ${delay / 1000}s before retry...`);
        }
        await sleep(delay);
        delay = Math.min(delay * 2, 30 * 60 * 1000); // Cap at 30 minutes
        continue;
      } else if (i < retries - 1) {
        // Other errors - retry with backoff
        console.warn(`⚠️ Request failed (${errorMessage}). Waiting ${delay / 1000}s before retry...`);
        await sleep(delay);
        delay = Math.min(delay * 1.5, 30 * 1000); // Cap at 30 seconds
        continue;
      }

      // If we've exhausted retries or it's a non-retryable error, throw
      throw err;
    }
  }
}

// ---------- Public API ----------
async function generatePlan({ projectName, lldMarkdown, projectIdea = '', projectDescription = '' }) {
  console.log(`🔧 [CodeGen] Generating plan for project: "${projectName}"`);
  console.log(`📝 [CodeGen] LLD length: ${lldMarkdown ? lldMarkdown.length : 0} characters`);
  
  // Check if LLD contains Twitter/social media terms
  if (lldMarkdown) {
    const socialTerms = ['tweet', 'twitter', 'social', 'post', 'follow', 'like', 'retweet'];
    const foundTerms = socialTerms.filter(term => 
      lldMarkdown.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundTerms.length > 0) {
      console.warn(`⚠️ [CodeGen] LLD contains social media terms: ${foundTerms.join(', ')}`);
      console.warn(`⚠️ [CodeGen] This might cause generic social media code generation`);
    }
  }
  
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`📋 [CodeGen] Attempt ${attempts}/${maxAttempts} for project "${projectName}"`);
    
    const prompt = buildPlanPrompt({ projectName, lldMarkdown, projectIdea, projectDescription });
    console.log(`📋 [CodeGen] Generated prompt length: ${prompt.length} characters`);
    
    const ai = await safeAIRequest(prompt, 3);
    console.log(`🤖 [CodeGen] AI response length: ${ai.length} characters`);
    
    const rawObj = extractStructuredObject(ai);
    const plan = PlanSchema.parse(rawObj);
    
    // Validate that the plan is project-specific
    if (plan.files) {
      const twitterFiles = plan.files.filter(file => {
        const path = file.path.toLowerCase();
        const purpose = file.purpose.toLowerCase();
        
        return path.includes('tweet') || 
               purpose.includes('tweet') ||
               path.includes('social') ||
               path.includes('tweetroutes') ||
               path.includes('tweetservice') ||
               purpose.includes('social') ||
               purpose.includes('twitter') ||
               path.includes('twitter');
      });
      
      if (twitterFiles.length > 0 && attempts < maxAttempts) {
        console.error(`❌ [CodeGen] Attempt ${attempts}: Generated plan contains Twitter/social files for project "${projectName}":`, 
          twitterFiles.map(f => f.path));
        console.log(`🔄 [CodeGen] Retrying with more specific prompt...`);
        
        // Update the LLD to be more specific for retry
        lldMarkdown = `🚫 CRITICAL INSTRUCTION: This is "${projectName}" - NOT Twitter, NOT social media, NOT a social networking app.

FORBIDDEN TERMS: Do not use tweet, twitter, social, post, follow, like, retweet in any file names or purposes.

PROJECT CONTEXT: ${projectName}

${lldMarkdown}

REMINDER: Generate files specific to "${projectName}" domain only.`;
        
        continue; // Retry with updated context
      } else if (twitterFiles.length > 0) {
        console.error(`❌ [CodeGen] Final attempt still generated Twitter files. Applying aggressive fix...`);
        
        // First try template fallback
        const template = getProjectTemplate(projectName, projectIdea, projectDescription);
        if (template) {
          console.log(`🔄 [CodeGen] Using template fallback for project type`);
          return { files: template.files };
        }
        
        // If no template, manually fix the generated files
        console.log(`🔧 [CodeGen] Manually fixing Twitter files to be project-specific`);
        const fixedFiles = plan.files.map(file => {
          let newPath = file.path;
          let newPurpose = file.purpose;
          
          // Replace Twitter-specific terms with project-appropriate ones
          if (file.path.toLowerCase().includes('tweet')) {
            // Determine appropriate replacement based on project name
            let replacement = 'item';
            if (projectName.toLowerCase().includes('todo') || projectName.toLowerCase().includes('task')) {
              replacement = 'task';
            } else if (projectName.toLowerCase().includes('shop') || projectName.toLowerCase().includes('store')) {
              replacement = 'product';
            } else if (projectName.toLowerCase().includes('blog') || projectName.toLowerCase().includes('article')) {
              replacement = 'article';
            }
            
            newPath = file.path.replace(/tweet/gi, replacement);
            newPurpose = file.purpose.replace(/tweet/gi, replacement);
          }
          
          // Fix other social media terms
          newPurpose = newPurpose.replace(/social media/gi, projectName);
          newPurpose = newPurpose.replace(/twitter/gi, projectName);
          
          return {
            ...file,
            path: newPath,
            purpose: newPurpose
          };
        });
        
        console.log(`✅ [CodeGen] Fixed files:`, fixedFiles.map(f => f.path));
        return { files: fixedFiles };
      } else {
        console.log(`✅ [CodeGen] Generated plan appears project-specific for "${projectName}"`);
      }
    }
    
    return plan;
  }
  
  throw new Error(`Failed to generate project-specific plan after ${maxAttempts} attempts`);
}

async function generateFileContent({ projectName, lldMarkdown, fileSpec, allFiles }) {
   const prompt = buildFileContentPrompt({
     projectName,
     lldMarkdown,
     filePath: fileSpec.path,
     purpose: fileSpec.purpose,
     language: fileSpec.language,
     neighborFiles: (allFiles || []).map(f => f.path).filter(p => p !== fileSpec.path).slice(0, 15),
   });

   const ai = await safeAIRequest(prompt, 3);

   // Extract code block
   let code = ai;

   // Try to extract from code blocks first
   const match = ai.match(/```[\w-]*\s*([\s\S]*?)```/);
   if (match) {
     code = match[1];
   }

   // Clean up the code - remove any remaining markdown markers
   code = code.trim();

   // Remove any leading language markers like ```javascript
   if (code.startsWith('```')) {
     const lines = code.split('\n');
     if (lines[0].match(/^```[\w-]*$/)) {
       lines.shift(); // Remove the opening marker
       code = lines.join('\n').trim();
     }
   }

   // Remove any trailing markers
   if (code.endsWith('```')) {
     code = code.slice(0, -3).trim();
   }

   return { code, language: fileSpec.language || "javascript" };
}

// ---------- Batch Generation ----------
async function generateBatchFileContents({ projectName, lldMarkdown, fileSpecs, allFiles }) {
  const batchSize = 2; // Process 2 files per batch to avoid overloading AI
  const results = [];

  for (let i = 0; i < fileSpecs.length; i += batchSize) {
    const batch = fileSpecs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(fileSpec => generateFileContent({ projectName, lldMarkdown, fileSpec, allFiles }))
    );
    results.push(...batchResults);

    // Throttle to avoid rate limits
    if (i + batchSize < fileSpecs.length) {
      await sleep(1000); // 1 second between batches
    }
  }

  return results;
}
   // Remove any trailing markers

module.exports = {
  generatePlan,
  generateFileContent,
};

