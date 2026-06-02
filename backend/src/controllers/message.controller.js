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
    const conversation = await findOrCreateConversation(
      senderId,
      receiverId
    );

    // Set expiry (4 days)
    const expiresAt = new Date(
      Date.now() + 4 * 24 * 60 * 60 * 1000
    );

    // Create message with conversationId
    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      text: text || "",
      image: imageUrl,
      expiresAt,
    });

    // Update latest message atomically
    await Conversation.findByIdAndUpdate(
      conversation._id,
      {
        $set: {
          lastMessage: newMessage._id,
        },
      },
      {
        new: true,
      }
    );

    // Emit message to all receiver sockets
    const receiverSocketIds = getReceiverSocketIds(receiverId);

    receiverSocketIds.forEach((socketId) => {
      io.to(socketId).emit("newMessage", newMessage);
    });

    // Emit message back to sender sockets too (multi-tab sync)
    const senderSocketIds = getReceiverSocketIds(
      senderId.toString()
    );

    senderSocketIds.forEach((socketId) => {
      io.to(socketId).emit("newMessage", newMessage);
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log(
      "Error in sendMessage controller:",
      error.message
    );
    res.status(500).json({
      error: "Internal server error",
    });
  }
};