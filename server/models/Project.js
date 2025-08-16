const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true }, // "Twitter Clone"
    idea: { type: String }, // raw idea text
    status: {
      type: String,
      enum: ["clarifying", "planned", "coding", "deployed"],
      default: "clarifying", // starts at planning stage
    },
    blueprint: { type: mongoose.Schema.Types.ObjectId, ref: "Blueprint" }, // link to generated blueprint
    design: { type: mongoose.Schema.Types.ObjectId, ref: "DesignDoc" }, // optional link to design doc
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);
