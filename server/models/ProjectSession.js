const mongoose = require("mongoose");

const ProjectSessionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true }, // must link to Project
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["idle", "starting", "running", "stopped", "error"],
      default: "idle",
    },
    containerId: { type: String }, // Docker container for isolated execution
    logs: [{ type: String }], // optional: store execution logs
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectSession", ProjectSessionSchema);
