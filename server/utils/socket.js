// Simple Socket.IO initializer
let ioInstance;

function initSocket(server) {
  const { Server } = require("socket.io");
  ioInstance = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });
  return ioInstance;
}

function io() {
  if (!ioInstance) throw new Error("Socket.io not initialized");
  return ioInstance;
}

module.exports = { initSocket, io };
