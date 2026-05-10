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
  },
  { timestamps: true }
);

// Ensure participants are always stored in consistent order
conversationSchema.pre("save", function (next) {
  this.participants.sort();
  next();
});

// Efficient lookup: find conversation by participants
conversationSchema.index({ participants: 1 });

export default mongoose.model("Conversation", conversationSchema);