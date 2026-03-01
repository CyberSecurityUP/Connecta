"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { User } from "@chat/shared";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setToken: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      setToken: (accessToken) => set({ accessToken }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "chat-auth",
    },
  ),
);
