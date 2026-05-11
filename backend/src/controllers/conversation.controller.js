import Conversation from "../models/conversation.model.js";

export const createConversation = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (myId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    const participants = [myId.toString(), userId.toString()].sort();

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

    res.status(200).json(conversation);
  } catch (error) {
    console.log("createConversation error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};