import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  selectedConversation: null,

  isConversationsLoading: false,
  isMessagesLoading: false,

  messageListener: null,

  // ✅ Fetch conversations list (sidebar)
  getConversations: async () => {
    set({ isConversationsLoading: true });

    try {
      const res = await axiosInstance.get("/conversations");
      set({ conversations: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch conversations"
      );
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  // ✅ Fetch messages using conversationId (Phase 6)
  getMessages: async (conversationId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(`/messages/${conversationId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // ✅ Send message using receiverId (not conversationId)
  sendMessage: async (messageData) => {
    const { selectedConversation } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedConversation) return;

    // Find the other user (receiver)
    const receiver = selectedConversation.participants.find(
      (u) => u._id !== authUser._id
    );

    if (!receiver) {
      return toast.error("Receiver not found");
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${receiver._id}`,
        messageData
      );

      set((state) => ({
        messages: [...state.messages, res.data],
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // ✅ Socket subscription (conversation-based filtering)
  subscribeToMessages: () => {
    const { selectedConversation, messageListener } = get();
    if (!selectedConversation) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // remove old listener if exists
    if (messageListener) {
      socket.off("newMessage", messageListener);
    }

    const handler = (newMessage) => {
      const currentConversation = get().selectedConversation;
      if (!currentConversation) return;

      // Only accept messages belonging to this conversation
      if (newMessage.conversationId !== currentConversation._id) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    };

    socket.on("newMessage", handler);

    set({ messageListener: handler });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { messageListener } = get();

    if (socket && messageListener) {
      socket.off("newMessage", messageListener);
    }

    set({ messageListener: null });
  },

  setSelectedConversation: (conversation) => {
    set({ selectedConversation: conversation, messages: [] });
  },
}));