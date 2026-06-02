import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Stores the latest message in the conversation
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure participants are stored in a consistent order
conversationSchema.pre("save", function (next) {
  this.participants.sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );
  next();
});

// Efficient lookup by participants
conversationSchema.index({ participants: 1 });

export default mongoose.model("Conversation", conversationSchema);