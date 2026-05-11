import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();

  if (!selectedConversation) return null;

  // get the other user (1-to-1 chat)
  const otherUser = selectedConversation.participants.find(
    (u) => u._id !== authUser._id
  );

  if (!otherUser) return null;

  const isOnline = onlineUsers.includes(otherUser._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img
                src={otherUser.profilePic || "/avatar.png"}
                alt={otherUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{otherUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedConversation(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;