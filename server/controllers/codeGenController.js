// controllers/codeGenController.js
// --------------------------------
// Fixes: ensure generated files are written into the same project workspace
// that fileService manages. Improves error handling and returns structured results.

const DesignDoc = require("../models/DesignDoc");
const Project = require("../models/Project");
const { generatePlan, generateFileContent } = require("../services/codeGenService");
// use same name as import above (generateFileContent)
const { FileService } = require("../services/fileService"); // existing file-service that handles user/project dirs
const { validateGeneratedFile } = require("../services/validationService");
const { codegenQueue, queueFileGeneration, processProjectJobs, getQueueStats, getJobStatus } = require("../workers/codegenWorker");
const { createRetryPrompt } = require("../utils/promptRefiner");
const path = require('path');

// Instantiate fileService with required dependencies
const projectService = {
  getProjectById: async (projectId) => {
    return await Project.findById(projectId);
  }
};
const config = {
  projectsRoot: path.join(__dirname, '..', 'projects')
};
const fileService = new FileService({ projectService, config });

/**
 * POST /api/v1/codegen/plan
 * body: { projectId }
 * -> Generates a file plan JSON from the latest LLD for that project.
 */
exports.createPlan = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null; // Handle missing auth for testing
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }

    const project = userId
      ? await Project.findOne({ _id: projectId, owner: userId })
      : await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    console.log(`🔧 [CodeGen Controller] Creating plan for project: "${project.name}" (ID: ${projectId})`);

    // pull latest LLD
    const lld = await DesignDoc.findOne({ project: projectId, type: "LLD" }).sort({ createdAt: -1 });
    if (!lld) {
      return res.status(400).json({ success: false, message: "No LLD found. Generate LLD first." });
    }

    console.log(`📝 [CodeGen Controller] Found LLD with ${lld.content.length} characters`);
    
    // Debug: Check if LLD contains problematic content
    const socialTerms = ['tweet', 'twitter', 'social', 'post', 'follow'];
    const foundTerms = socialTerms.filter(term => 
      lld.content.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundTerms.length > 0) {
      console.warn(`⚠️ [CodeGen Controller] LLD contains social media terms: ${foundTerms.join(', ')}`);
      console.log(`📋 [CodeGen Controller] LLD preview:`, lld.content.substring(0, 500));
    }

    // Use the codeGenService to generate a file plan (list of file specs)
    const plan = await generatePlan({ 
      projectName: project.name, 
      lldMarkdown: lld.content,
      projectIdea: project.idea || '',
      projectDescription: project.description || ''
    });

    // store plan on project for apply step
    project.codegenPlan = { files: plan.files || [] };
    project.codegenPlanHistory = project.codegenPlanHistory || [];
    project.codegenPlanHistory.push({ files: plan.files || [], createdAt: new Date() });
    await project.save();

    console.log(`✅ [CodeGen Controller] Generated plan with ${plan.files?.length || 0} files`);
    if (plan.files) {
      console.log(`📁 [CodeGen Controller] Generated files:`, plan.files.map(f => f.path));
    }

    return res.status(201).json({ success: true, plan });
  } catch (err) {
    console.error("CodeGen Plan Error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate plan" });
  }
};

/**
 * POST /api/v1/codegen/apply
 * body: { projectId, dryRun?: boolean, paths?: string[] }
 * -> Generates file contents and writes them (unless dryRun=true).
 *    If paths[] provided, only generate those files; else generate all from plan.
 */
exports.applyPlan = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null; // Handle missing auth for testing
    const { projectId, dryRun = false, paths } = req.body;

    console.log("🔧 [CodeGen Apply] Body:", req.body);
    console.log("🔧 [CodeGen Apply] User:", req.user);

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const project = userId
      ? await Project.findOne({ _id: projectId, owner: userId })
      : await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Must have a stored plan (from /codegen/plan)
    const plan = project.codegenPlan;
    if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) {
      return res.status(400).json({ success: false, message: "No file plan found. Run /codegen/plan first." });
    }

    // Subset selection (optional)
    const selectedFiles = Array.isArray(paths) && paths.length > 0
      ? plan.files.filter(f => paths.includes(f.path))
      : plan.files;

    const results = [];

    // Pull latest LLD for context (fallback to project stored lld if any)
    const lldDoc = await DesignDoc.findOne({ project: projectId, type: "LLD" }).sort({ createdAt: -1 });
    const lldMarkdown = lldDoc ? lldDoc.content : (project.lld || "# No LLD found");

    // Iterate selected files and generate content
    for (const fileSpec of selectedFiles) {
      try {
        // generateFileContent returns { code, meta } or similar
        const genRes = await generateFileContent({
          projectName: project.name,
          lldMarkdown,
          fileSpec,
          allFiles: plan.files
        });

        const code = genRes?.code ?? genRes?.content ?? "";

        // Write to file system only if not dryRun
        if (!dryRun) {
          // IMPORTANT: fileService.writeFile expects an object with userId, projectId, relativePath, content
          const fullPathWritten = await fileService.writeFile({
            userId: userId,
            projectId: project._id,
            relativePath: fileSpec.path,
            content: code,
            overwrite: true
          });

          // log for debug
          console.log(`Wrote file: ${fullPathWritten}`);
        }

        results.push({ file: fileSpec.path, status: "ok" });
        // small throttle to avoid overloading AI provider or disk
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`❌ Failed ${fileSpec.path}:`, err && err.message ? err.message : err);
        results.push({ file: fileSpec.path, status: "error", error: err?.message || String(err) });
      }
    }

    return res.status(200).json({
      success: true,
      dryRun: dryRun, // explicitly set dryRun to boolean value passed in
      written: dryRun ? 0 : results.filter(r => r.status === "ok").length,
      files: results
    });
  } catch (err) {
    console.error("CodeGen Apply Error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate/apply files" });
  }
};

/**
 * POST /api/v1/codegen/applyBatch
 * body: { projectId, dryRun?: boolean, paths?: string[] }
 * -> Generates file contents in batches and writes them (unless dryRun=true).
 *    Supports retry and status tracking.
 */
exports.applyPlanBatch = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { projectId, dryRun = false, paths } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const project = userId
      ? await Project.findOne({ _id: projectId, owner: userId })
      : await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const plan = project.codegenPlan;
    if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) {
      return res.status(400).json({ success: false, message: "No file plan found. Run /codegen/plan first." });
    }

    // Select files to generate
    const selectedFiles = Array.isArray(paths) && paths.length > 0
      ? plan.files.filter(f => paths.includes(f.path))
      : plan.files;

    // Initialize or update codegenStatus map
    if (!project.codegenStatus) {
      project.codegenStatus = new Map();
    }

    // Filter files that are pending or failed with retries left
    const filesToGenerate = selectedFiles.filter(fileSpec => {
      const status = project.codegenStatus.get(fileSpec.path);
      if (!status) return true; // no status means pending
      if (status.status === "completed") return false;
      if (status.status === "failed" && status.attempts >= 5) return false; // max retries
      return true;
    });

    if (filesToGenerate.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No files to generate",
        dryRun: dryRun,
        written: 0,
        files: []
      });
    }

    const lldDoc = await DesignDoc.findOne({ project: projectId, type: "LLD" }).sort({ createdAt: -1 });
    const lldMarkdown = lldDoc ? lldDoc.content : (project.lld || "# No LLD found");

    const batchSize = 2;
    const results = [];

    for (let i = 0; i < filesToGenerate.length; i += batchSize) {
      const batch = filesToGenerate.slice(i, i + batchSize);

      // Update status to in-progress
      batch.forEach(fileSpec => {
        project.codegenStatus.set(fileSpec.path, {
          status: "in-progress",
          attempts: (project.codegenStatus.get(fileSpec.path)?.attempts || 0) + 1,
          lastAttempt: new Date(),
          error: null
        });
      });
      await project.save();

      // Generate batch contents
      const batchResults = await Promise.all(batch.map(async (fileSpec) => {
        try {
          const genRes = await generateFileContent({
            projectName: project.name,
            lldMarkdown,
            fileSpec,
            allFiles: plan.files
          });
          const code = genRes?.code ?? genRes?.content ?? "";

          if (!dryRun) {
            await fileService.writeFile({
              userId,
              projectId: project._id,
              relativePath: fileSpec.path,
              content: code,
              overwrite: true
            });
          }

          // Validate generated code (basic non-empty check)
          if (!code || code.trim().length === 0) {
            throw new Error("Generated code is empty");
          }

          // Update status to completed
          project.codegenStatus.set(fileSpec.path, {
            status: "completed",
            attempts: project.codegenStatus.get(fileSpec.path).attempts,
            lastAttempt: new Date(),
            error: null
          });
          await project.save();

          return { file: fileSpec.path, status: "ok" };
        } catch (err) {
          // Update status to failed with error
          project.codegenStatus.set(fileSpec.path, {
            status: "failed",
            attempts: project.codegenStatus.get(fileSpec.path).attempts,
            lastAttempt: new Date(),
            error: err.message || String(err)
          });
          await project.save();

          return { file: fileSpec.path, status: "error", error: err.message || String(err) };
        }
      }));

      results.push(...batchResults);

      // Throttle between batches
      if (i + batchSize < filesToGenerate.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return res.status(200).json({
      success: true,
      dryRun: dryRun,
      written: dryRun ? 0 : results.filter(r => r.status === "ok").length,
      files: results
    });
  } catch (err) {
    console.error("CodeGen ApplyBatch Error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate/apply files in batch" });
  }
};

/**
 * GET /api/v1/codegen/status
 * query: { projectId }
 * -> Returns the current codegen status for all files in the plan.
 */
exports.getCodegenStatus = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const project = userId
      ? await Project.findOne({ _id: projectId, owner: userId })
      : await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const plan = project.codegenPlan;
    if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) {
      return res.status(400).json({ success: false, message: "No file plan found. Run /codegen/plan first." });
    }

    const statusMap = {};
    plan.files.forEach(fileSpec => {
      const status = project.codegenStatus?.get(fileSpec.path);
      statusMap[fileSpec.path] = status || { status: "pending", attempts: 0, lastAttempt: null, error: null };
    });

    return res.status(200).json({ success: true, status: statusMap });
  } catch (err) {
    console.error("CodeGen Status Error:", err);
    return res.status(500).json({ success: false, message: "Failed to get codegen status" });
  }
};

/**
 * POST /api/v1/codegen/applyQueue
 * body: { projectId, dryRun?: boolean, paths?: string[] }
 * -> Uses queue system for reliable file generation with retries and status tracking.
 */
exports.applyPlanQueue = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { projectId, dryRun = false, paths } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const project = userId
      ? await Project.findOne({ _id: projectId, owner: userId })
      : await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const plan = project.codegenPlan;
    if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) {
      return res.status(400).json({ success: false, message: "No file plan found. Run /codegen/plan first." });
    }

    // Initialize status tracking
    if (!project.codegenStatus) {
      project.codegenStatus = new Map();
    }

    // Get LLD for context
    const lldDoc = await DesignDoc.findOne({ project: projectId, type: "LLD" }).sort({ createdAt: -1 });
    const lldMarkdown = lldDoc ? lldDoc.content : (project.lld || "# No LLD found");

    // Select files to generate
    const selectedFiles = Array.isArray(paths) && paths.length > 0
      ? plan.files.filter(f => paths.includes(f.path))
      : plan.files;

    // Queue jobs for files that need generation
    const jobIds = [];
    for (const fileSpec of selectedFiles) {
      const status = project.codegenStatus.get(fileSpec.path);
      if (!status || status.status === 'pending' || (status.status === 'failed' && status.attempts < 5)) {
        const jobId = await queueFileGeneration({
          projectId: project._id,
          userId,
          fileSpec,
          allFiles: plan.files,
          lldMarkdown,
          projectName: project.name,
          dryRun
        });
        jobIds.push(jobId);
      }
    }

    if (jobIds.length === 0) {
      return res.status(200).json({ success: true, message: "All files are already completed or at max retries" });
    }

    await project.save();

    return res.status(200).json({
      success: true,
      message: `${jobIds.length} files queued for generation`,
      jobIds,
      queueStats: getQueueStats()
    });
  } catch (err) {
    console.error("CodeGen ApplyQueue Error:", err);
    return res.status(500).json({ success: false, message: "Failed to queue file generation" });
  }
};

/**
 * POST /api/v1/codegen/finalize
 * body: { projectId }
 * -> Finalizes code generation: runs linting, tests, and creates build artifact.
 */
exports.finalizeCodegen = async (req, res) => {
  try {
    const userId = req.user ? req.user.userId : null;
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }
    const project = userId
      ? await Project.findOne({ _id: projectId, owner: userId })
      : await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const plan = project.codegenPlan;
    if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) {
      return res.status(400).json({ success: false, message: "No file plan found. Run /codegen/plan first." });
    }

    // Check if all files are completed
    const allCompleted = plan.files.every(fileSpec => {
      const status = project.codegenStatus?.get(fileSpec.path);
      return status && status.status === 'completed';
    });

    if (!allCompleted) {
      return res.status(400).json({
        success: false,
        message: "Not all files are completed. Please ensure all files are generated before finalizing."
      });
    }

    const results = {
      linting: null,
      testing: null,
      build: null
    };

    // Run ESLint if available
    try {
      const { execSync } = require('child_process');
      const projectPath = path.join(config.projectsRoot, userId, project._id.toString());

      // Run eslint --fix
      execSync('npx eslint --fix . --ext .js,.ts,.jsx,.tsx', {
        cwd: projectPath,
        stdio: 'pipe'
      });
      results.linting = { status: 'passed', message: 'ESLint fixes applied' };
    } catch (error) {
      results.linting = { status: 'warning', message: `ESLint issues: ${error.message}` };
    }

    // Run tests if package.json has test script
    try {
      const { execSync } = require('child_process');
      const projectPath = path.join(config.projectsRoot, userId, project._id.toString());

      execSync('npm test', {
        cwd: projectPath,
        stdio: 'pipe'
      });
      results.testing = { status: 'passed', message: 'Tests passed' };
    } catch (error) {
      results.testing = { status: 'failed', message: `Tests failed: ${error.message}` };
    }

    // Create build artifact (zip)
    try {
      const { execSync } = require('child_process');
      const projectPath = path.join(config.projectsRoot, userId, project._id.toString());
      const buildPath = path.join(projectPath, 'build.zip');

      execSync(`zip -r build.zip . -x "*.git*" "node_modules/*"`, {
        cwd: projectPath,
        stdio: 'pipe'
      });

      results.build = { status: 'created', path: buildPath };
    } catch (error) {
      results.build = { status: 'failed', message: `Build creation failed: ${error.message}` };
    }

    // Update project with finalization results
    project.codegenFinalized = {
      completedAt: new Date(),
      results
    };
    await project.save();

    return res.status(200).json({
      success: true,
      message: "Code generation finalized",
      results
    });
  } catch (err) {
    console.error("CodeGen Finalize Error:", err);
    return res.status(500).json({ success: false, message: "Failed to finalize code generation" });
  }
};
