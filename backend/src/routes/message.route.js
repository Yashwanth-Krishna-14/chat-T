import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

// Sidebar users (can be replaced later with /conversations)
router.get("/users", protectRoute, getUsersForSidebar);

// Phase 6: get messages by conversationId
router.get("/:conversationId", protectRoute, getMessages);

// send message to a user (creates/finds conversation internally)
router.post("/send/:id", protectRoute, sendMessage);

export default router;