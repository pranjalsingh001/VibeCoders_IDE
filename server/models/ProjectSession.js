const mongoose = require("mongoose");

const ProjectSessionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    status: {
      type: String,
      enum: ["active", "stopped", "error"], // match controller values
      default: "active",
    },
    containerId: { type: String },
    port: { type: Number },
    url: { type: String },
    logs: [{ type: String }],
    meta: { type: Object }, // optional, for mode=stub/dev/docker
    startedAt: { type: Date },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectSession", ProjectSessionSchema);
