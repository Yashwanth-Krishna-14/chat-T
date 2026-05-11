import Conversation from "../models/conversation.model.js";

export const createConversation = async (req, res) => {
  try {
    console.log("REQ USER:", req.user);
    console.log("PARAM USERID:", req.params.userId);

    // 🔒 Guard: prevents 500 crash
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const myId = req.user._id;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (myId.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
    }

    // ✅ IMPORTANT: keep ObjectIds consistent (no strings)
    const participants = [myId, userId].sort();

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
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: { $in: [userId] }
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