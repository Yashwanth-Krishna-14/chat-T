import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const {
    getConversations,
    conversations,
    selectedConversation,
    setSelectedConversation,
    isConversationsLoading,
  } = useChatStore();

  const { authUser, onlineUsers } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  // Get the "other user" from a conversation (1-to-1 chat)
  const getOtherUser = (conversation) => {
    return conversation.participants.find((u) => u._id !== authUser._id);
  };

  const filteredConversations = showOnlineOnly
    ? conversations.filter((conv) => {
        const otherUser = getOtherUser(conv);
        return otherUser && onlineUsers.includes(otherUser._id);
      })
    : conversations;

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Chats</span>
        </div>

        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>

          <span className="text-xs text-zinc-500">
            ({onlineUsers.length - 1} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredConversations.map((conversation) => {
          const otherUser = getOtherUser(conversation);

          if (!otherUser) return null;

          return (
            <button
              key={conversation._id}
              onClick={() => setSelectedConversation(conversation)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${
                  selectedConversation?._id === conversation._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={otherUser.profilePic || "/avatar.png"}
                  alt={otherUser.fullName}
                  className="size-12 object-cover rounded-full"
                />

                {onlineUsers.includes(otherUser._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{otherUser.fullName}</div>

                <div className="text-sm text-zinc-400 truncate">
                  {conversation.lastMessage?.text
                    ? conversation.lastMessage.text
                    : conversation.lastMessage?.image
                    ? "📷 Photo"
                    : "No messages yet"}
                </div>
              </div>
            </button>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            No conversations
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;