"use client";

import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  rightPanel: { type: "thread"; messageId: string; channelId: string } | { type: "profile"; userId: string } | null;
  activeModal: string | null;
  commandPaletteOpen: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openThread: (messageId: string, channelId: string) => void;
  openProfile: (userId: string) => void;
  closeRightPanel: () => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  rightPanel: null,
  activeModal: null,
  commandPaletteOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openThread: (messageId, channelId) => set({ rightPanel: { type: "thread", messageId, channelId } }),
  openProfile: (userId) => set({ rightPanel: { type: "profile", userId } }),
  closeRightPanel: () => set({ rightPanel: null }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));
