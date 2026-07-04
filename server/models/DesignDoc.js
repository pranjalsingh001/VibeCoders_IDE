// models/DesignDoc.js
const mongoose = require("mongoose");

const DesignDocSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  type: { 
    type: String, 
    enum: [
      "clarification-questions", 
      "clarification-answers",   
      "HLD", 
      "LLD"
    ], 
    required: true 
  },
  content: { type: mongoose.Schema.Types.Mixed, required: true }, 
  promptUsed: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("DesignDoc", DesignDocSchema);
