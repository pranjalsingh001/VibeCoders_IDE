const ProjectSession = require("../models/ProjectSession");

async function findActiveSession(projectId) {
  return await ProjectSession.findOne({ project: projectId, status: "active" });
}

module.exports = {
  findActiveSession
};
