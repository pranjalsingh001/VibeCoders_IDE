// models/Blueprint.js
// -------------------
// Blueprint model for storing AI-generated project blueprints.
// Includes user reference, project details, clarifications, structured blueprint content, and versioning.

const mongoose = require("mongoose");

if (!mongoose.models.Blueprint) {
 const blueprintSchema = new mongoose.Schema(
    {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    projectName: { type: String, required: true },
    ideaDescription: { type: String, required: true },
    clarifications: { type: mongoose.Schema.Types.Mixed, default: null },
    generatedBlueprint: { type: Object, default: {} },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
 );

 module.exports = mongoose.model("Blueprint", blueprintSchema);
} else {
 module.exports = mongoose.models.Blueprint;
}
