"use client";

import { create } from "zustand";

interface TypingState {
  typingUsers: Record<string, string[]>; // channelId -> userIds

  addTypingUser: (channelId: string, userId: string) => void;
  removeTypingUser: (channelId: string, userId: string) => void;
  getTypingUsers: (channelId: string) => string[];
}

export const useTypingStore = create<TypingState>()((set, get) => ({
  typingUsers: {},

  addTypingUser: (channelId, userId) =>
    set((state) => {
      const current = state.typingUsers[channelId] || [];
      if (current.includes(userId)) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: [...current, userId],
        },
      };
    }),

  removeTypingUser: (channelId, userId) =>
    set((state) => {
      const current = state.typingUsers[channelId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: current.filter((id) => id !== userId),
        },
      };
    }),

  getTypingUsers: (channelId) => get().typingUsers[channelId] || [],
}));
