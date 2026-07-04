// models/Project.js
const mongoose = require("mongoose");

const FileSpecSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },     // e.g., "backend/index.js"
    purpose: { type: String },                  // description of file role
    language: { type: String },                 // "javascript", "json", etc.
    dependsOn: [{ type: String }],              // optional: list of dependent files
  },
  { _id: false }
);

const PlanningSchema = new mongoose.Schema(
  {
    questions: [{ type: String }],
    promptUsed: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CodegenPlanSchema = new mongoose.Schema(
  {
    files: [FileSpecSchema],                     // array of file specs
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CodegenStatusSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["pending", "in-progress", "completed", "failed"], default: "pending" },
    attempts: { type: Number, default: 0 },
    lastAttempt: { type: Date },
    error: { type: String },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    idea: { type: String, required: true  },

    status: {
      type: String,
      enum: ["clarifying", "planned", "coding", "deployed"],
      default: "clarifying",
    },
    workflow: {
  stage: { type: String, enum: ["planning", "blueprint", "hld", "lld", "codegen", "completed"], default: "planning" },
  status: { type: String, enum: ["pending", "in-progress", "completed", "failed"], default: "pending" },
  updatedAt: { type: Date, default: Date.now }
},

    blueprint: { type: mongoose.Schema.Types.ObjectId, ref: "Blueprint" },
    design: { type: mongoose.Schema.Types.ObjectId, ref: "DesignDoc" },

   
    planning: PlanningSchema,
    codegenPlan: CodegenPlanSchema,

    // Per-file generation status tracking
    codegenStatus: {
      type: Map,
      of: CodegenStatusSchema,
      default: new Map()
    },

    // (Optional) Keep a history of multiple plans
    codegenPlanHistory: [CodegenPlanSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
