import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";

export const createConversation = async (req, res) => {
  try {
    // 🔒 Guard: prevents 500 crash
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const myId = req.user._id;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Convert both IDs to ObjectId for consistency
    const myObjectId = new mongoose.Types.ObjectId(myId);
    const targetObjectId = new mongoose.Types.ObjectId(userId);

    if (myObjectId.equals(targetObjectId)) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
    }

    // ✅ Ensure both are ObjectIds
    const participants = [myObjectId, targetObjectId].sort();

    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
    })
      .populate("participants", "fullName profilePic")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "fullName profilePic")
        .populate("lastMessage");
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.log("createConversation error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const getConversations = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user._id;
    
    // Ensure userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const conversations = await Conversation.find({
      participants: { $in: [userObjectId] }
    })
      .populate("participants", "fullName profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return res.status(200).json(conversations);
  } catch (error) {
    console.log("getConversations error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};