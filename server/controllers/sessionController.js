const ProjectSession = require("../models/ProjectSession");
const Project = require("../models/Project");
const {
  startProjectContainer,
  stopProjectContainer,
  streamContainerLogs,
  isDockerAvailable,
  getContainerStatus,
  getContainerLogs,
  checkDocker,
  monitorContainerHealth
} = require("../services/dockerService");
const { findActiveSession } = require("../services/executionService");
const { emitToProject } = require("../utils/socket");

exports.startSession = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    // Fetch project details for scaffolding if needed
    const project = await Project.findById(projectId);
    if (!project || project.owner.toString() !== userId) {
      return res.status(404).json({ success: false, message: "Project not found or unauthorized" });
    }

    // FIRST: Check if there's already a running container for this project
    const existingSession = await findActiveSession(projectId);

    if (existingSession) {
      console.log(`🔍 Found existing session: ${existingSession.containerId}`);

      // Check if the container is actually still running
      try {
        const containerStatus = await getContainerStatus(existingSession.containerId);

        if (containerStatus.running) {
          console.log(`✅ Container ${existingSession.containerId} is still running`);

          // Just update the session timestamp and return existing session
          await ProjectSession.findByIdAndUpdate(existingSession._id, {
            lastActivity: new Date()
          });

          return res.json({
            success: true,
            message: "Using existing session",
            session: existingSession
          });
        } else {
          console.log(`⚠️ Container ${existingSession.containerId} is not running, cleaning up...`);
          // Container exists but not running, clean it up
          await stopProjectContainer(existingSession);
          await ProjectSession.findByIdAndUpdate(existingSession._id, {
            status: "stopped",
            endedAt: new Date()
          });
          // Continue to create new session
        }
      } catch (error) {
        console.log(`⚠️ Container ${existingSession.containerId} not found, cleaning up session...`);
        await ProjectSession.findByIdAndUpdate(existingSession._id, {
          status: "stopped",
          endedAt: new Date()
        });
        // Continue to create new session
      }
    }

    // Only create new container if no valid existing session
    console.log(`🚀 Creating new session for project ${projectId}`);
    const { container, hostPort } = await startProjectContainer({ userId, projectId });

    const session = await ProjectSession.create({
      project: projectId,
      owner: userId,
      status: "active",
      containerId: container.id,
      port: hostPort,
      url: `http://localhost:${hostPort}`,
      startedAt: new Date(),
      lastActivity: new Date()
    });

    await streamContainerLogs(container, session._id, projectId);

    // Start health monitoring
    const healthMonitor = await monitorContainerHealth(container.id, session._id, projectId);

    // Store monitor reference in session if needed
    await ProjectSession.findByIdAndUpdate(session._id, {
      healthMonitor: true
    });

    // Scaffold basic files if directory is empty
    const fs = require('fs/promises');
    const path = require('path');
    const projectsRoot = path.join(__dirname, '..', 'projects');
    const projectDir = path.join(projectsRoot, userId, projectId);
    try {
      const entries = await fs.readdir(projectDir, { withFileTypes: true });
      const hasFiles = entries.some(entry => entry.isFile());
      if (!hasFiles) {
        const packageJson = {
          name: project.name.toLowerCase().replace(/\s+/g, '-'),
          version: '0.1.0',
          description: project.idea,
          main: 'index.js',
          scripts: { start: 'node index.js' },
          dependencies: {},
          devDependencies: {}
        };
        await fs.writeFile(path.join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        await fs.writeFile(path.join(projectDir, 'README.md'), `# ${project.name}\n\n${project.idea}\n\nStart by running \`npm install\` and \`npm start\`.`);
        await fs.writeFile(path.join(projectDir, '.gitignore'), 'node_modules/\n.env\n.DS_Store\n*.log');
        await fs.writeFile(path.join(projectDir, 'index.js'), `console.log('Hello from ${project.name}!');\n// Add your code here and run with: npm start`);
        console.log(`📁 Created basic scaffold files for project ${projectId}`);
      }
    } catch (scaffoldErr) {
      console.error(`⚠️ Failed to scaffold basic files for ${projectId}:`, scaffoldErr.message);
    }

    res.json({
      success: true,
      message: "Session started successfully.",
      session
    });
  } catch (err) { 
    console.error("🚨 startSession error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to start runtime (container).",
      error: err.message
    });
  }
};

// Add this new endpoint to get logs for a container
exports.getContainerLogs = async (req, res) => {
  try {
    const { containerId } = req.params;
    const { tail = 100 } = req.query;

    console.log(`📋 Getting logs for container: ${containerId}`);

    const result = await getContainerLogs(containerId, parseInt(tail));

    if (result.success) {
      res.json({
        success: true,
        logs: result.logs,
        containerId
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.message,
        containerId
      });
    }
  } catch (err) {
    console.error("🚨 getContainerLogs error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to get container logs."
    });
  }
};

exports.stopSession = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.userId;

    console.log(`🛑 Stopping session for project ${projectId}`);
    const session = await findActiveSession(projectId);
    if (!session) {
      return res.status(404).json({ success: false, message: "No active session found for this project." });
    }

    if (session.owner.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You do not have permission to stop this session." });
    }

    await stopProjectContainer(session);

    await ProjectSession.updateOne({ _id: session._id }, {
      status: "stopped",
      endedAt: new Date()
    });

    emitToProject(projectId, "project:status", {
      projectId,
      status: "stopped"
    });

    res.json({ success: true, message: "Session stopped successfully." });
  } catch (err) {
    console.error("🚨 stopSession error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to stop session.",
      error: err.message
    });
  }
};

exports.getSessionStatus = async (req, res) => {
  try {
    const { projectId } = req.params;

    console.log(`📊 Getting session status for project ${projectId}`);
    const session = await findActiveSession(projectId);
    if (!session) {
      return res.json({ success: true, status: "inactive" });
    }

    // Check actual container status
    const containerStatus = await getContainerStatus(session.containerId);
    if (!containerStatus.running && session.status === "active") {
      // Update session if container is not running
      await ProjectSession.updateOne({ _id: session._id }, {
        status: "stopped",
        endedAt: new Date()
      });
      session.status = "stopped";
    }

    res.json({
      success: true,
      status: session.status,
      session: {
        id: session._id,
        containerId: session.containerId,
        port: session.port,
        url: session.url,
        startedAt: session.startedAt,
        containerStatus
      }
    });
  } catch (err) {
    console.error("🚨 getSessionStatus error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to get session status.",
      error: err.message
    });
  }
};

exports.getDockerStatus = async (req, res) => {
  try {
    console.log("🐳 Checking Docker status");
    const available = isDockerAvailable();
    res.json({ success: true, dockerAvailable: available });
  } catch (err) {
    console.error("🚨 getDockerStatus error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to check Docker status.",
      error: err.message
    });
  }
};

exports.debugContainer = async (req, res) => {
  try {
    const { containerId } = req.params;

    console.log(`🔍 Debugging container: ${containerId}`);
    const status = await getContainerStatus(containerId);
    const logsResult = await getContainerLogs(containerId);

    res.json({
      success: true,
      containerId,
      status,
      logs: logsResult.success ? logsResult.logs : "Failed to get logs"
    });
  } catch (err) {
    console.error("🚨 debugContainer error:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to debug container.",
      error: err.message
    });
  }
};

