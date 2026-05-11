import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Plus } from "lucide-react";

const Sidebar = () => {
  const {
    getConversations,
    conversations,
    selectedConversation,
    setSelectedConversation,
    isConversationsLoading,

    getUsers,          // ✅ must exist in store
    users,             // ✅ must exist in store
    isUsersLoading,    // ✅ must exist in store
    createConversation // ✅ must exist in store
  } = useChatStore();

  const { authUser, onlineUsers } = useAuthStore();

  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  const getOtherUser = (conversation) => {
    return conversation.participants.find((u) => u._id !== authUser._id);
  };

  const filteredConversations = showOnlineOnly
    ? conversations.filter((conv) => {
        const otherUser = getOtherUser(conv);
        return otherUser && onlineUsers.includes(otherUser._id);
      })
    : conversations;

  const openNewChatModal = async () => {
    setShowNewChatModal(true);
    await getUsers(); // fetch users list for new chat
  };

  const startChat = async (userId) => {
    const conversation = await createConversation(userId);

    if (conversation) {
      setSelectedConversation(conversation);
      setShowNewChatModal(false);
    }
  };

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Chats</span>
          </div>

          {/* ✅ New Chat Button */}
          <button
            onClick={openNewChatModal}
            className="btn btn-sm btn-primary hidden lg:flex gap-2"
          >
            <Plus className="size-4" />
            New
          </button>
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

      {/* Conversations */}
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

      {/* ✅ New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-base-200 rounded-lg w-[90%] max-w-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Start New Chat</h2>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setShowNewChatModal(false)}
              >
                ✕
              </button>
            </div>

            {isUsersLoading ? (
              <p className="text-center text-zinc-500">Loading users...</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => startChat(user._id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-base-300 rounded-md"
                  >
                    <img
                      src={user.profilePic || "/avatar.png"}
                      className="size-10 rounded-full"
                      alt={user.fullName}
                    />
                    <div className="text-left">
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-zinc-400">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;