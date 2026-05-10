import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    // better than createdAt TTL
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// fast message fetching + pagination
messageSchema.index({ conversationId: 1, createdAt: -1 });

// TTL index (delete exactly after expiresAt time)
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Message = mongoose.model("Message", messageSchema);

export default Message;