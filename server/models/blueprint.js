const mongoose = require("mongoose");

const blueprintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    ideaDescription: {
      type: String,
      required: true,
    },
    generatedBlueprint: {
      type: Object, // Will contain structured response (tech stack, steps, diagrams, etc.)
      default: {},
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blueprint", blueprintSchema);
