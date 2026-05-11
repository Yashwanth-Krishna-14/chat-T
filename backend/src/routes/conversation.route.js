import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getConversations, createConversation } from "../controllers/conversation.controller.js";

const router = express.Router();

router.get("/", protectRoute, getConversations);

// create/find 1-to-1 conversation
router.post("/:userId", protectRoute, createConversation);

export default router;