const Docker = require("dockerode");
const { emitToProject } = require("../utils/socket");
const ProjectSession = require("../models/ProjectSession");
const { buildProjectPath } = require("./fileService");
const fs = require("fs").promises;
const stream = require("stream");

// Docker configuration
const docker = new Docker({
  socketPath: process.platform === "win32" ? "//./pipe/docker_engine" : "/var/run/docker_sock"
});

let dockerAvailable = false;

/**
 * Check Docker availability
 */
async function checkDocker() {
  try {
    await docker.ping();
    dockerAvailable = true;
    console.log("✅ Docker daemon is available");
    return true;
  } catch (error) {
    dockerAvailable = false;
    console.warn("⚠️ Docker daemon is not available. Container operations will be disabled.");
    console.debug("Docker connection error:", error.message);
    return false;
  }
}

/**
 * Verify project has required files for execution
 */
async function verifyProjectStructure(projectDir) {
  try {
    // Check if package.json exists
    const packageJsonPath = `${projectDir}/package.json`;
    try {
      await fs.access(packageJsonPath);
      console.log("✅ package.json found");
      
      // Check if package.json has a start script
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      if (!packageJson.scripts || !packageJson.scripts.start) {
        console.warn("⚠️ package.json does not have a 'start' script");
        return false;
      }
      console.log("✅ start script found in package.json:", packageJson.scripts.start);
      return true;
    } catch (err) {
      console.error("❌ package.json not found or inaccessible:", err.message);
      return false;
    }
  } catch (error) {
    console.error("Error verifying project structure:", error.message);
    return false;
  }
}

// Check Docker on startup
checkDocker();

/**
 * Get Docker availability status
 */
function isDockerAvailable() {
  return dockerAvailable;
}

/**
 * Start a Docker container for the project
 */
async function startProjectContainer({ userId, projectId }) {
  if (!dockerAvailable) {
    throw new Error("Docker daemon is not available. Please ensure Docker is running.");
  }

  try {
    const projectDir = await buildProjectPath({ userId, projectId, relativePath: "" });
    console.log(`🔨 Starting container for project ${projectId} from directory: ${projectDir}`);

    // Verify project structure
    const projectValid = await verifyProjectStructure(projectDir);
    if (!projectValid) {
      throw new Error("Project structure is invalid. Ensure package.json with start script exists.");
    }

    // Read package.json to get the actual start command
    let startCommand = "npm run start";
    try {
      const packageJsonPath = `${projectDir}/package.json`;
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      if (packageJson.scripts && packageJson.scripts.start) {
        startCommand = `npm run start`;
      }
    } catch (err) {
      console.warn("Could not read package.json, using default start command");
    }

    // Create container with better configuration to prevent auto-stop
    const container = await docker.createContainer({
      Image: "node:18", // Use regular node instead of alpine for better compatibility
      WorkingDir: "/usr/src/app",
      Cmd: ["sh", "-c", `
        # Install dependencies first
        echo "Installing dependencies..."
        npm install || echo "Installation completed with warnings"
        
        # Start the application with nohup to keep it running
        echo "Starting application..."
        ${startCommand}
      `],
      ExposedPorts: { "3000/tcp": {} },
      HostConfig: {
        Binds: [`${projectDir}:/usr/src/app`],
        AutoRemove: false, // DON'T auto-remove so we can inspect issues
        NetworkMode: "bridge",
        PortBindings: { "3000/tcp": [{ HostPort: "0" }] },
        // Add restart policy to try restarting on failure
        RestartPolicy: {
          Name: "on-failure",
          MaximumRetryCount: 3
        }
      },
      AttachStdout: true,
      AttachStderr: true,
      Tty: true, // Allocate pseudo-TTY for better output
      OpenStdin: false
    });

    await container.start();
    console.log("✅ Docker container started:", container.id);

    // Wait longer for container to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const inspectData = await container.inspect();
    console.log("Container inspect data:", {
      state: inspectData.State.Status,
      running: inspectData.State.Running,
      exitCode: inspectData.State.ExitCode,
      error: inspectData.State.Error
    });

    if (!inspectData.State.Running) {
      // Get detailed logs to understand why it stopped
      try {
        const logs = await container.logs({
          stdout: true,
          stderr: true,
          timestamps: true
        });
        console.log("Container logs on failure:", logs.toString('utf8'));
      } catch (logError) {
        console.error("Failed to get container logs:", logError.message);
      }
      
      throw new Error(`Container failed to start. State: ${inspectData.State.Status}, Exit Code: ${inspectData.State.ExitCode}`);
    }

    const hostPort = inspectData.NetworkSettings.Ports["3000/tcp"][0].HostPort;
    console.log(`🌐 Container mapped to host port: ${hostPort}`);

    return { container, hostPort };
  } catch (error) {
    console.error("🚨 Failed to start project container:", error.message);
    throw new Error(`Failed to start container: ${error.message}`);
  }
}

/**
 * Stop a Docker container
 */
async function stopProjectContainer(session) {
  if (!dockerAvailable) {
    console.warn("⚠️ Docker not available, cannot stop container");
    return;
  }

  try {
    console.log(`🛑 Attempting to stop container: ${session.containerId}`);
    const container = docker.getContainer(session.containerId);
    
    try {
      const containerInfo = await container.inspect();
      console.log(`Container ${session.containerId} current state:`, containerInfo.State.Status);
      
      if (containerInfo.State.Running) {
        console.log(`⏳ Stopping running container: ${session.containerId}`);
        await container.stop({ t: 10 }); // Give it 10 seconds to stop gracefully
        console.log(`✅ Container stopped successfully: ${session.containerId}`);
      } else if (containerInfo.State.Status === 'exited') {
        console.log(`ℹ️ Container already stopped: ${session.containerId}`);
      } else {
        console.log(`ℹ️ Container in state '${containerInfo.State.Status}': ${session.containerId}`);
      }

      // Try to remove the container if it's not auto-removing
      try {
        await container.remove();
        console.log(`🗑️ Container removed: ${session.containerId}`);
      } catch (removeError) {
        if (removeError.statusCode === 409) {
          console.log(`ℹ️ Container already in process of removal: ${session.containerId}`);
        } else if (removeError.statusCode !== 404) {
          console.warn(`⚠️ Could not remove container ${session.containerId}:`, removeError.message);
        }
      }
    } catch (inspectError) {
      if (inspectError.statusCode === 404) {
        console.warn(`⚠️ Container not found: ${session.containerId}`);
        return;
      }
      throw inspectError;
    }
  } catch (err) {
    console.error("🚨 stopProjectContainer error:", err.message);
    throw err;
  }
}

/**
 * Stream container logs to WebSocket & DB - IMPROVED VERSION
 */
async function streamContainerLogs(container, sessionId, projectId) {
  if (!dockerAvailable) {
    console.warn("⚠️ Docker not available, cannot stream logs");
    return;
  }

  try {
    console.log(`📊 Setting up log streaming for container: ${container.id}`);
    
    // Get existing logs first
    try {
      const existingLogs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 50, // Get more logs for better context
        timestamps: true
      });
      
      if (existingLogs.length > 0) {
        const logsText = existingLogs.toString('utf8').trim();
        const logLines = logsText.split('\n').filter(line => line.trim());
        
        for (const logLine of logLines) {
          console.log(`[Existing Log ${container.id}]`, logLine);
          
          // Send to WebSocket with timestamp
          const timestamp = new Date().toISOString();
          emitToProject(projectId, "logs:update", { 
            projectId, 
            log: logLine,
            timestamp,
            type: logLine.includes('error') ? 'error' : 'info'
          });
          
          // Save to database
          await ProjectSession.findByIdAndUpdate(sessionId, {
            $push: { logs: { message: logLine, timestamp: new Date() } }
          });
        }
      }
    } catch (logError) {
      console.error("Failed to get existing logs:", logError.message);
    }

    // Set up live log streaming with better error handling
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: 0, // Start from now
      timestamps: true
    });

    // Handle log data
    logStream.on("data", async (chunk) => {
      try {
        const logLine = chunk.toString("utf-8").trim();
        if (!logLine) return;

        console.log(`[Live Log ${container.id}]`, logLine);

        const timestamp = new Date().toISOString();
        const logType = logLine.toLowerCase().includes('error') ? 'error' : 
                       logLine.toLowerCase().includes('warn') ? 'warning' : 'info';

        // Send to WebSocket clients
        emitToProject(projectId, "logs:update", {
          projectId,
          log: logLine,
          timestamp,
          type: logType,
          containerId: container.id
        });

        // Save to database with timestamp
        await ProjectSession.findByIdAndUpdate(sessionId, {
          $push: { 
            logs: { 
              message: logLine, 
              timestamp: new Date(),
              type: logType
            } 
          }
        });

      } catch (error) {
        console.error("Error processing log chunk:", error.message);
      }
    });

    logStream.on("end", () => {
      console.log(`🛑 Log stream ended for project ${projectId}`);
      emitToProject(projectId, "project:status", { 
        projectId, 
        status: "stopped",
        containerId: container.id
      });
    });

    logStream.on("error", (error) => {
      console.error(`🚨 Log stream error for project ${projectId}:`, error.message);
      emitToProject(projectId, "logs:error", {
        projectId,
        error: "Log streaming failed",
        message: error.message
      });
    });

    console.log(`✅ Log streaming active for container: ${container.id}`);

  } catch (error) {
    console.error("🚨 Failed to setup container log streaming:", error.message);
    emitToProject(projectId, "logs:error", {
      projectId,
      error: "Failed to setup log streaming",
      message: error.message
    });
  }
}

/**
 * Get container status directly from Docker
 */
async function getContainerStatus(containerId) {
  if (!dockerAvailable) {
    return { available: false, status: "docker_unavailable" };
  }

  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return {
      available: true,
      status: info.State.Status,
      running: info.State.Running,
      exitCode: info.State.ExitCode,
      error: info.State.Error,
      startedAt: info.State.StartedAt,
      finishedAt: info.State.FinishedAt
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return { available: true, status: "not_found" };
    }
    return { available: true, status: "error", error: error.message };
  }
}

/**
 * Get container logs directly
 */
async function getContainerLogs(containerId, tail = 100) {
  if (!dockerAvailable) {
    return { success: false, message: "Docker not available" };
  }

  try {
    const container = docker.getContainer(containerId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: tail,
      timestamps: true
    });
    
    return {
      success: true,
      logs: logs.toString('utf8')
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Monitor container health and restart if needed
 */
async function monitorContainerHealth(containerId, sessionId, projectId) {
  if (!dockerAvailable) return;

  const checkInterval = 30000; // Check every 30 seconds

  const monitor = setInterval(async () => {
    try {
      const status = await getContainerStatus(containerId);
      
      if (!status.running && status.status === 'exited') {
        console.log(`⚠️ Container ${containerId} stopped unexpectedly`);
        
        // Update session status
        await ProjectSession.findByIdAndUpdate(sessionId, {
          status: "stopped",
          endedAt: new Date(),
          exitCode: status.exitCode,
          error: status.error
        });

        // Notify clients
        emitToProject(projectId, "project:status", { 
          projectId, 
          status: "stopped",
          reason: "container_exited",
          exitCode: status.exitCode
        });

        clearInterval(monitor);
      }
    } catch (error) {
      console.error("Container health check failed:", error.message);
    }
  }, checkInterval);

  return monitor;
}

module.exports = { 
  startProjectContainer,
  stopProjectContainer,
  streamContainerLogs,
  isDockerAvailable,
  checkDocker,
  getContainerStatus,
  getContainerLogs,
  monitorContainerHealth
};