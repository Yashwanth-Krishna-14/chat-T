import Conversation from "../models/conversation.model.js";

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (err) {
    console.log("getConversations error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
