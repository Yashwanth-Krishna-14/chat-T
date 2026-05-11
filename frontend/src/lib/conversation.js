import Conversation from "../models/conversation.model.js";

export async function findOrCreateConversation(userA, userB) {
  if (userA.toString() === userB.toString()) {
    throw new Error("Cannot create conversation with yourself");
  }

  const participants = [userA.toString(), userB.toString()].sort();

  let conversation = await Conversation.findOne({
    participants: { $all: participants, $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({ participants });
  }

  return conversation;
}