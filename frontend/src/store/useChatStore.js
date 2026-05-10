import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  messageListener: null, // ✅ store reference

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

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      set({ messages: [...get().messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, messageListener } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // ✅ if already subscribed, unsubscribe first
    if (messageListener) {
      socket.off("newMessage", messageListener);
    }

    const handler = (newMessage) => {
      const currentSelectedUser = get().selectedUser;
      if (!currentSelectedUser) return;

      const isFromSelectedUser =
        newMessage.senderId === currentSelectedUser._id;

      if (!isFromSelectedUser) return;

      set({ messages: [...get().messages, newMessage] });
    };

    socket.on("newMessage", handler);

    // store handler reference so we can remove it later
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

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));