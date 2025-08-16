const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const sanitize = require("sanitize-filename");

// root where project code will live (ignored by Git)
const PROJECTS_ROOT = path.join(process.cwd(), "projects");

// Builds a safe absolute path for a user/project file
function buildProjectPath({ userId, projectId, relativePath }) {
  const safeUser = sanitize(String(userId));
  const safeProject = sanitize(String(projectId));
  const safeRel = relativePath ? relativePath.split("/").map(sanitize).join(path.sep) : "";
  const fullPath = path.join(PROJECTS_ROOT, safeUser, safeProject, safeRel);
  // Prevent path traversal
  const normalized = path.normalize(fullPath);
  if (!normalized.startsWith(path.join(PROJECTS_ROOT, safeUser, safeProject))) {
    throw new Error("Invalid path.");
  }
  return normalized;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

// Write file contents safely
async function writeFile({ userId, projectId, relativePath, content }) {
  const fullPath = buildProjectPath({ userId, projectId, relativePath });
  await ensureDir(path.dirname(fullPath));
  await fsp.writeFile(fullPath, content, "utf8");
  return fullPath;
}

// Read file
async function readFile({ userId, projectId, relativePath }) {
  const fullPath = buildProjectPath({ userId, projectId, relativePath });
  const content = await fsp.readFile(fullPath, "utf8");
  return { fullPath, content };
}

// List directory (shallow)
async function listDir({ userId, projectId, relativeDir = "" }) {
  const dirPath = buildProjectPath({ userId, projectId, relativePath: relativeDir });
  await ensureDir(dirPath);
  const names = await fsp.readdir(dirPath, { withFileTypes: true });
  return names.map((e) => ({ name: e.name, type: e.isDirectory() ? "dir" : "file" }));
}

module.exports = { writeFile, readFile, listDir, buildProjectPath, PROJECTS_ROOT };
