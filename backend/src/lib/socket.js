import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

// userId -> Set(socketId)
const userSocketMap = new Map();

export function getReceiverSocketIds(userId) {
  return userSocketMap.get(userId) ? Array.from(userSocketMap.get(userId)) : [];
}

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

/**
 * Socket Auth Middleware (JWT based)
 * Frontend must connect like:
 * io(BACKEND_URL, { auth: { token: "<JWT>" } })
 */
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized: No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;

    next();
  } catch (err) {
    console.log("❌ Socket Auth Error:", err.message);
    next(new Error("Unauthorized: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id, "User:", socket.userId);

  const userId = socket.userId;

  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }

  userSocketMap.get(userId).add(socket.id);

  // Debug log (helps catch duplicate sockets)
  console.log(
    `👤 User ${userId} active sockets:`,
    userSocketMap.get(userId).size
  );

  // Emit online users list
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", (reason) => {
    console.log("❌ User disconnected:", socket.id, "Reason:", reason);

    if (userSocketMap.has(userId)) {
      userSocketMap.get(userId).delete(socket.id);

      if (userSocketMap.get(userId).size === 0) {
        userSocketMap.delete(userId);
      }
    }

    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

export { io, app, server };