// models/DesignDoc.js
const mongoose = require("mongoose");

const DesignDocSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  type: { 
    type: String, 
    enum: [
      "clarification-questions", 
      "clarification-answers",   
      "hld", 
      "lld"
    ], 
    required: true 
  },
  content: { type: mongoose.Schema.Types.Mixed, required: true }, // flexible: text or JSON
  promptUsed: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("DesignDoc", DesignDocSchema);
