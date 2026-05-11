import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  selectedConversation: null,

  users: [], // ✅ required for new chat modal
  isUsersLoading: false,

  isConversationsLoading: false,
  isMessagesLoading: false,

  messageListener: null,

  // ✅ Fetch users list (for New Chat modal)
  getUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

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

  // ✅ Fetch messages using conversationId
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

  // ✅ Create / find conversation (used when starting a new chat)
  createConversation: async (userId) => {
    try {
      const res = await axiosInstance.post(`/conversations/${userId}`);
      const newConversation = res.data;

      const exists = get().conversations.find(
        (c) => c._id === newConversation._id
      );

      if (!exists) {
        set({ conversations: [newConversation, ...get().conversations] });
      }

      set({ selectedConversation: newConversation, messages: [] });

      return newConversation; // ✅ IMPORTANT
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create conversation"
      );
      return null;
    }
  },

  // ✅ Send message using receiverId
  sendMessage: async (messageData) => {
    const { selectedConversation } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedConversation) return;

    const receiver = selectedConversation.participants.find(
      (u) => u._id !== authUser._id
    );

    if (!receiver) {
      toast.error("Receiver not found");
      return;
    }

    try {
      const res = await axiosInstance.post(
        `/messages/send/${receiver._id}`,
        messageData
      );

      set((state) => ({
        messages: [...state.messages, res.data],
      }));

      // ✅ update lastMessage locally so sidebar updates instantly
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv._id === selectedConversation._id
            ? { ...conv, lastMessage: res.data, updatedAt: new Date() }
            : conv
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // ✅ Socket subscription
  subscribeToMessages: () => {
    const { selectedConversation, messageListener } = get();
    if (!selectedConversation) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    if (messageListener) {
      socket.off("newMessage", messageListener);
    }

    const handler = (newMessage) => {
      const currentConversation = get().selectedConversation;
      if (!currentConversation) return;

      if (newMessage.conversationId !== currentConversation._id) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));

      // ✅ update sidebar lastMessage in realtime
      set((state) => ({
        conversations: state.conversations.map((conv) =>
          conv._id === currentConversation._id
            ? { ...conv, lastMessage: newMessage, updatedAt: new Date() }
            : conv
        ),
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