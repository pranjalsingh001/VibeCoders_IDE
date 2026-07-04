const { successResponse, errorResponse } = require('../utils/apiResponse');
const Project = require('../models/Project');
const fs = require('fs/promises');
const path = require('path');

async function write(req, res) {
  try {
    console.log('Starting file write endpoint');
    if (!req.user || !req.user.userId) {
      console.log('Missing req.user or userId in write');
      return errorResponse(res, 'Unauthorized - missing user', 401);
    }
    const userId = req.user.userId;
    console.log('UserId extracted for write:', userId);

    const { projectId, relativePath, content } = req.body;
    console.log('Write request params:', { projectId, relativePath: !!relativePath, contentLength: content?.length });
    if (!projectId || !relativePath) {
      return errorResponse(res, 'projectId and relativePath required', 400);
    }

    console.log('Fetching project for write');
    const project = await Project.findById(projectId);
    if (!project || !project.owner || project.owner.toString() !== userId) {
      console.log('Write auth failed');
      return errorResponse(res, 'Unauthorized', 401);
    }
    console.log('Write auth passed');

    const projectsRoot = path.join(__dirname, '..', 'projects');
    const fullPath = path.join(projectsRoot, userId, projectId, relativePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf8');
    console.log('File written successfully');
    return successResponse(res, { message: 'File written' });
  } catch (e) {
    console.error('File write error:', e);
    return errorResponse(res, 'Failed to write file', 500);
  }
}

async function read(req, res) {
  try {
    console.log('Starting file read endpoint');
    if (!req.user || !req.user.userId) {
      console.log('Missing req.user or userId in read');
      return errorResponse(res, 'Unauthorized - missing user', 401);
    }
    const userId = req.user.userId;
    console.log('UserId extracted for read:', userId);

    const { projectId, relativePath } = req.query;
    console.log('Read request params:', { projectId, relativePath });
    if (!projectId || !relativePath) {
      return errorResponse(res, 'projectId and relativePath required', 400);
    }

    console.log('Fetching project for read');
    const project = await Project.findById(projectId);
    if (!project || !project.owner || project.owner.toString() !== userId) {
      console.log('Read auth failed');
      return errorResponse(res, 'Unauthorized', 401);
    }
    console.log('Read auth passed');

    const projectsRoot = path.join(__dirname, '..', 'projects');
    const fullPath = path.join(projectsRoot, userId, projectId, relativePath);
    await fs.access(fullPath);
    const content = await fs.readFile(fullPath, 'utf8');
    console.log('File read successfully');
    return successResponse(res, { content, relativePath });
  } catch (e) {
    console.error('File read error:', e);
    return errorResponse(res, 'Failed to read file', 500);
}

async function list(req, res) {
  let fullDir;
  try {
    console.log('Starting file list endpoint');
    if (!req.user || !req.user.userId) {
      console.log('Missing req.user or userId');
      return errorResponse(res, 'Unauthorized - missing user', 401);
    }
    const userId = req.user.userId;
    console.log('UserId extracted:', userId);

    const { projectId, dir, recursive } = req.query;
    console.log('File list request:', { projectId, dir, recursive, userId });
    if (!projectId) {
      console.log('Missing projectId');
      return errorResponse(res, 'projectId required', 400);
    }

    const project = await Project.findById(projectId);
    if (!project || !project.owner || project.owner.toString() !== userId) {
      console.log('Project auth failed');
      return errorResponse(res, 'Unauthorized', 401);
    }

    const projectsRoot = path.join(__dirname, '..', 'projects');
    const relativeDir = dir || '';
    const baseDir = path.join(projectsRoot, userId, projectId);
    fullDir = path.join(baseDir, relativeDir);

    try {
      await fs.access(fullDir);
    } catch (accessError) {
      if (accessError.code === 'ENOENT') {
        await fs.mkdir(fullDir, { recursive: true });
        return successResponse(res, { entries: [] });
      } else {
        throw accessError;
      }
    }

    if (recursive === 'true') {
      const allFiles = [];
      async function walk(currentDir) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
          allFiles.push({
            name: relativePath,
            type: entry.isDirectory() ? 'dir' : 'file'
          });
          if (entry.isDirectory()) {
            await walk(fullPath);
          }
        }
      }
      await walk(baseDir);
      return successResponse(res, { entries: allFiles });
    }

    const entries = await fs.readdir(fullDir, { withFileTypes: true });
    const fileEntries = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'dir' : 'file'
    }));
    return successResponse(res, { entries: fileEntries });
  } catch (e) {
    console.error('File list error:', e);
    return errorResponse(res, 'Failed to list directory', 500);
  }
}

module.exports = { write, read, list };
