// server/workers/codegenWorker.js - Worker for processing codegen jobs
const JobQueue = require("../utils/queue");
const { generateFileContent } = require("../services/codeGenService");
const { validateGeneratedFile } = require("../services/validationService");
const Project = require("../models/Project");
const DesignDoc = require("../models/DesignDoc");
const { FileService } = require("../services/fileService");
const path = require('path');

// Initialize queue
const codegenQueue = new JobQueue();

// Initialize file service
const projectService = {
  getProjectById: async (projectId) => {
    return await Project.findById(projectId);
  }
};
const config = {
  projectsRoot: path.join(__dirname, '..', 'projects')
};
const fileService = new FileService({ projectService, config });

// Job handler for generating a single file
async function handleFileGeneration(jobData, job) {
  const { projectId, userId, fileSpec, allFiles, lldMarkdown, projectName, dryRun = false } = jobData;

  try {
    // Ensure fileSpec.path is a string (handle ObjectId case)
    const filePath = typeof fileSpec.path === 'string' ? fileSpec.path : fileSpec.path.toString();

    // Generate file content
    const genRes = await generateFileContent({
      projectName,
      lldMarkdown,
      fileSpec: { ...fileSpec, path: filePath },
      allFiles
    });

    const code = genRes?.code ?? genRes?.content ?? "";

    // Validate generated code
    validateGeneratedFile(code, { ...fileSpec, path: filePath });

    // Write to file system if not dry run
    if (!dryRun) {
      await fileService.writeFile({
        userId,
        projectId,
        relativePath: filePath,
        content: code,
        overwrite: true
      });
    }

    // Update project status
    const project = await Project.findById(projectId);
    if (project && project.codegenStatus) {
      project.codegenStatus.set(filePath, {
        status: "completed",
        attempts: job.attempts + 1,
        lastAttempt: new Date(),
        error: null
      });
      await project.save();
    }

    return { file: filePath, status: "completed", codeLength: code.length };
  } catch (error) {
    // Update project status on failure
    const project = await Project.findById(projectId);
    const filePath = typeof fileSpec.path === 'string' ? fileSpec.path : fileSpec.path.toString();

    if (project && project.codegenStatus) {
      project.codegenStatus.set(filePath, {
        status: "failed",
        attempts: job.attempts + 1,
        lastAttempt: new Date(),
        error: error.message
      });
      await project.save();
    }

    throw error;
  }
}

// Register the handler
codegenQueue.registerHandler('generateFile', handleFileGeneration);

// Export functions for use by controller
module.exports = {
  codegenQueue,

  // Add a file generation job to the queue
  async queueFileGeneration({ projectId, userId, fileSpec, allFiles, lldMarkdown, projectName, dryRun = false }) {
    return await codegenQueue.add('generateFile', {
      projectId,
      userId,
      fileSpec,
      allFiles,
      lldMarkdown,
      projectName,
      dryRun
    }, {
      maxRetries: 5,
      retryDelay: 2000 // Start with 2s delay
    });
  },

  // Get queue stats
  getQueueStats() {
    return codegenQueue.getStats();
  },

  // Get job status
  getJobStatus(jobId) {
    return codegenQueue.getJob(jobId);
  },

  // Process all pending jobs for a project
  async processProjectJobs(projectId) {
    const project = await Project.findById(projectId);
    if (!project || !project.codegenPlan || !project.codegenPlan.files) {
      throw new Error('Project or codegen plan not found');
    }

    const lldDoc = await DesignDoc.findOne({ project: projectId, type: "LLD" }).sort({ createdAt: -1 });
    const lldMarkdown = lldDoc ? lldDoc.content : (project.lld || "# No LLD found");

    const jobs = [];
    for (const fileSpec of project.codegenPlan.files) {
      const status = project.codegenStatus?.get(fileSpec.path);
      if (!status || status.status === 'pending' || (status.status === 'failed' && status.attempts < 5)) {
        const jobId = await this.queueFileGeneration({
          projectId: project._id,
          userId: project.owner,
          fileSpec,
          allFiles: project.codegenPlan.files,
          lldMarkdown,
          projectName: project.name
        });
        jobs.push(jobId);
      }
    }

    return jobs;
  }
};
