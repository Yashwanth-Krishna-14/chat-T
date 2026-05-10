import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";
import { findOrCreateConversation } from "../lib/conversation.js";

// Sidebar users (unchanged)
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get messages between logged-in user and selected user (conversation based)
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Authorization check: user must be part of conversation
    const isParticipant = conversation.participants
      .map((id) => id.toString())
      .includes(myId.toString());

    if (!isParticipant) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const messages = await Message.find({
      conversationId,
      expiresAt: { $gt: new Date() }, // ephemeral filter
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send message (conversation based)
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    let imageUrl = "";

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Find or create conversation
    const conversation = await findOrCreateConversation(senderId, receiverId);

    // Set expiry (4 days)
    const expiresAt = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    // Create message with conversationId
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      text: text || "",
      image: imageUrl,
      expiresAt,
    });

    // Update conversation metadata
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Emit message to all receiver sockets
    const receiverSocketIds = getReceiverSocketIds(receiverId);

    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("newMessage", newMessage);
    });

    // Emit message back to sender sockets too (multi-tab sync)
    const senderSocketIds = getReceiverSocketIds(senderId.toString());

    senderSocketIds.forEach((socketId) => {
      io.to(socketId).emit("newMessage", newMessage);
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};