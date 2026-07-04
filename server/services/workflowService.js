const Project = require("../models/Project");
const Blueprint = require("../models/blueprint");
const DesignDoc = require("../models/DesignDoc");
const planningService = require("./planningService");
const blueprintBuilder = require("./blueprintBuilder");
const designService = require("./designService");
const codeGenService = require("./codeGenService");
const { validate } = require("./validationService");
const { withRetry } = require("./retryService");

async function runNextStage(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw new Error("Project not found");

  let stage = project.workflow.stage;
  let result;

  try {
    project.workflow.status = "in-progress";
    await project.save();

    switch (stage) {
      case "planning":
        console.log(`🔄 Starting planning generation for project: ${project.name}`);
        
        result = await withRetry(() => planningService.generate(project), 5, 1000);
        
        console.log(`✅ Planning completed successfully for project: ${project.name}`);
        project.planning = result;
        project.workflow.stage = "blueprint";
        await project.save();
        console.log(`🔄 Project updated to blueprint stage`);
        break;

      case "blueprint": {
        console.log(`🔄 Starting blueprint generation for project: ${project.name}`);
        
        result = await withRetry(() => blueprintBuilder.generate({
          projectName: project.name,
          ideaDescription: project.idea,
          answers: project.planning?.answers || null,
        }), 5, 2000);

        console.log(`✅ Blueprint generated successfully for project: ${project.name}`);

        validate("blueprint", result);

        const blueprint = new Blueprint({
          user: project.owner,
          project: project._id, // ✅ link to project
          projectName: project.name,
          ideaDescription: project.idea,
          clarifications: project.planning?.answers || null,
          generatedBlueprint: result,
        });

        await blueprint.save();

        project.blueprint = blueprint._id;
        project.workflow.stage = "hld";
        await project.save(); // ✅ Save immediately so ref isn’t lost

        break;
      }


      case "hld":
        console.log(`🔄 Starting HLD generation for project: ${project.name}`);
        
        result = await withRetry(() => designService.generateHLD(project), 5, 2000);
        
        console.log(`✅ HLD generated successfully for project: ${project.name}`);
        validate("hld", result);
        
        // Save HLD to DesignDoc and update project.design
        const hldDoc = new DesignDoc({
          project: project._id,
          type: "HLD",
          content: JSON.stringify(result),
          versionTag: "v1",
        });
        await hldDoc.save();
        console.log(`💾 HLD saved to database with ID: ${hldDoc._id}`);
        
        project.design = hldDoc._id;
        project.workflow.stage = "lld";
        await project.save();
        console.log(`🔄 Project updated to LLD stage`);
        break;

      case "lld":
        console.log(`🔄 Starting LLD generation for project: ${project.name}`);
        
        result = await withRetry(() => designService.generateLLD(project), 5, 2000);
        
        console.log(`✅ LLD generated successfully for project: ${project.name}`);
        validate("lld", result);
        
        // Save LLD to DesignDoc
        const lldDoc = new DesignDoc({
          project: project._id,
          type: "LLD",
          content: JSON.stringify(result),
          versionTag: "v1",
        });
        await lldDoc.save();
        console.log(`💾 LLD saved to database with ID: ${lldDoc._id}`);
        
        // Update project to point to LLD (or keep HLD reference, depending on requirements)
        project.workflow.stage = "codegen";
        await project.save();
        console.log(`🔄 Project updated to codegen stage`);
        break;

      case "codegen":
        console.log(`🔄 Starting codegen plan generation for project: ${project.name}`);
        
        result = await withRetry(() => codeGenService.generatePlan(project), 5, 2000);
        
        console.log(`✅ Codegen plan generated successfully for project: ${project.name}`);
        validate("codegen", result);
        
        // Save codegen plan to project
        project.codegenPlan = result;
        project.workflow.stage = "completed";
        await project.save();
        console.log(`🎉 Project workflow completed for: ${project.name}`);
        break;

      default:
        throw new Error("Workflow already completed");
    }

    // Only set to completed if we're actually at the final stage
    if (project.workflow.stage === "completed") {
      project.workflow.status = "completed";
    } else {
      project.workflow.status = "pending"; // Ready for next stage
    }
    await project.save();
    return { success: true, stage: project.workflow.stage, result };

  } catch (err) {
    project.workflow.status = "failed";
    await project.save();
    console.error(`🚨 Workflow failed at ${stage}:`, err.message);
    throw err;
  }
}

async function getWorkflowStatus(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, owner: userId })
    .populate('blueprint')
    .populate('design'); // assuming design is HLD

  if (!project) throw new Error("Project not found");

  // Fix: Map workflow.status "pending" to "idle" for UI consistency
  let uiStatus = project.workflow.status;
  if (uiStatus === "pending") {
    uiStatus = "idle";
  }

  const status = {
    stage: project.workflow.stage,
    status: uiStatus,
    results: {}
  };

  // Fetch planning questions and answers
  const answersDoc = await DesignDoc.findOne({
    project: projectId,
    type: "clarification-answers",
  });
  const questionsDoc = await DesignDoc.findOne({
    project: projectId,
    type: "clarification-questions",
  });
  if (questionsDoc || answersDoc) {
    status.results.planning = {
    questions: questionsDoc ? questionsDoc.content : (project.planning || []),
      answers: answersDoc ? answersDoc.content : []
    };
  }

  // Fetch blueprint
  if (project.blueprint) {
    status.results.blueprint = project.blueprint.generatedBlueprint;
  }

  // Fetch HLD
  const hldDoc = await DesignDoc.findOne({
    project: projectId,
    type: "HLD"
  }).sort({ createdAt: -1 });
  if (hldDoc) {
    try {
      status.results.hld = JSON.parse(hldDoc.content);
    } catch (e) {
      status.results.hld = hldDoc.content; // fallback to raw string if JSON parse fails
    }
  }

  // Fetch LLD
  const lldDoc = await DesignDoc.findOne({
    project: projectId,
    type: "LLD"
  }).sort({ createdAt: -1 });
  if (lldDoc) {
    try {
      status.results.lld = JSON.parse(lldDoc.content);
    } catch (e) {
      status.results.lld = lldDoc.content; // fallback to raw string if JSON parse fails
    }
  }

  return status;
}

async function resetWorkflow(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, owner: userId });
  if (!project) throw new Error("Project not found");

  // Reset workflow status to allow restarting
  project.workflow.status = "pending";
  project.workflow.updatedAt = new Date();
  await project.save();

  console.log(`🔄 Workflow reset for project ${projectId}`);
  return await getWorkflowStatus(projectId, userId);
}

module.exports = { runNextStage, getWorkflowStatus, resetWorkflow };
