// services/executionService.js
// Starts a container for a project and streams logs via Socket.IO

const Docker = require("dockerode");
const path = require("path");
const { io } = require("../utils/socket");
const { buildProjectPath } = require("./fileService");
const ProjectSession = require("../models/ProjectSession");

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

async function startProjectContainer({ userId, projectId }) {
  // Mount project directory into container and run "node server.js" or similar
  const projectDir = buildProjectPath({ userId, projectId, relativePath: "" });

  const container = await docker.createContainer({
    Image: "node:18-alpine",
    WorkingDir: "/usr/src/app",
    Cmd: ["npm", "run", "start"], // assumes your project has a start script
    HostConfig: {
      Binds: [`${projectDir}:/usr/src/app`],
      AutoRemove: true,
      NetworkMode: "bridge",
    },
    ExposedPorts: { "3000/tcp": {} },
    // Optionally publish a port dynamically or via a fixed mapping
    // HostConfig: { PortBindings: { "3000/tcp": [{ HostPort: "0" }] } }
  });

  await container.start();

  // Save session
  const session = await ProjectSession.create({
    project: projectId,
    owner: userId,
    status: "running",
    containerId: container.id,
  });

  // Stream logs to socket room = projectId
  const logStream = await container.logs({ stdout: true, stderr: true, follow: true });
  logStream.on("data", (chunk) => {
    io().to(String(projectId)).emit("container:log", chunk.toString());
  });
  logStream.on("end", () => {
    io().to(String(projectId)).emit("container:stopped");
  });

  return { containerId: container.id, sessionId: session._id };
}

async function stopProjectContainer({ sessionId }) {
  const session = await ProjectSession.findById(sessionId);
  if (!session || !session.containerId) return;

  const container = docker.getContainer(session.containerId);
  try {
    await container.stop({ t: 1 });
  } catch (_) {}
  session.status = "stopped";
  await session.save();
}

module.exports = { startProjectContainer, stopProjectContainer };
