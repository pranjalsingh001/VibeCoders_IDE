const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join project room when user connects to a project
    socket.on("join-project", (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`User ${socket.userId} joined project: ${projectId}`);
    });

    // Leave project room
    socket.on("leave-project", (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`User ${socket.userId} left project: ${projectId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Emit to all users in a project room
const emitToProject = (projectId, event, data) => {
  const io = getIO();
  io.to(`project:${projectId}`).emit(event, data);
};

// Emit to specific user
const emitToUser = (userId, event, data) => {
  const io = getIO();
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = {
  initSocket,
  getIO,
  emitToProject,
  emitToUser,
};