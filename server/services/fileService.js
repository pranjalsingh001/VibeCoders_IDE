const fs = require('fs/promises');
const path = require('path');
const { access } = require('fs/promises');
const Project = require('../models/Project');

async function buildProjectPath({ userId, projectId, relativePath = '' }) {
  const project = await Project.findById(projectId);
  if (!project || project.owner.toString() !== userId) {
    throw new Error('Unauthorized access to project');
  }

  const projectsRoot = process.env.PROJECTS_ROOT || path.join(__dirname, '../../../projects');
  return path.join(projectsRoot, userId.toString(), projectId.toString(), relativePath);
}

class FileService {
  constructor({ projectService, config }) {
    this.projectService = projectService;
    this.projectsRoot = config.projectsRoot;
  }

  async writeFile({ userId, projectId, relativePath, content }) {
    const project = await this.projectService.getProjectById(projectId);
    if (!project || project.owner.toString() !== userId) {
      throw new Error('Unauthorized access to project');
    }

    const fullPath = path.join(this.projectsRoot, userId.toString(), projectId.toString(), relativePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
    return fullPath;
  }

  async readFile({ userId, projectId, relativePath }) {
    const project = await this.projectService.getProjectById(projectId);
    if (!project || project.owner.toString() !== userId) {
      throw new Error('Unauthorized access to project');
    }

    const fullPath = path.join(this.projectsRoot, userId.toString(), projectId.toString(), relativePath);
    await access(fullPath); // Check if exists
    const content = await fs.readFile(fullPath, 'utf8');
    return { content, relativePath };
  }

  async listDir({ userId, projectId, relativeDir = '' }) {
    const project = await this.projectService.getProjectById(projectId);
    if (!project || project.owner.toString() !== userId) {
      throw new Error('Unauthorized access to project');
    }

    const fullDir = path.join(this.projectsRoot, userId.toString(), projectId.toString(), relativeDir);
    await access(fullDir); // Check if dir exists
    const entries = await fs.readdir(fullDir, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(relativeDir, entry.name)
    }));
  }
}

module.exports = { FileService, buildProjectPath };
