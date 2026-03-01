"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DraftState {
  drafts: Record<string, string>;

  setDraft: (targetId: string, content: string) => void;
  getDraft: (targetId: string) => string | undefined;
  clearDraft: (targetId: string) => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},

      setDraft: (targetId, content) =>
        set((s) => ({ drafts: { ...s.drafts, [targetId]: content } })),

      getDraft: (targetId) => get().drafts[targetId],

      clearDraft: (targetId) =>
        set((s) => {
          const { [targetId]: _, ...rest } = s.drafts;
          return { drafts: rest };
        }),
    }),
    { name: "chat-drafts" },
  ),
);
