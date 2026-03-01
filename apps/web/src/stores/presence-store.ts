"use client";

import { create } from "zustand";

import { PresenceStatus } from "@chat/shared";

interface UserPresence {
  status: PresenceStatus;
  customStatus?: string;
  lastSeen?: string;
}

interface PresenceState {
  presenceMap: Record<string, UserPresence>;

  setPresence: (userId: string, presence: UserPresence) => void;
  setBulkPresence: (entries: Array<{ userId: string; status: PresenceStatus }>) => void;
  getPresence: (userId: string) => UserPresence;
}

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  presenceMap: {},

  setPresence: (userId, presence) =>
    set((state) => ({
      presenceMap: { ...state.presenceMap, [userId]: presence },
    })),

  setBulkPresence: (entries) =>
    set((state) => {
      const next = { ...state.presenceMap };
      entries.forEach(({ userId, status }) => {
        next[userId] = { ...next[userId], status };
      });
      return { presenceMap: next };
    }),

  getPresence: (userId) =>
    get().presenceMap[userId] ?? { status: "offline" },
}));
