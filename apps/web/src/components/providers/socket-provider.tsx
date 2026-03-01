"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Socket } from "socket.io-client";

import { ServerEvent } from "@chat/shared";

import { useAuthStore } from "@/stores/auth-store";
import { usePresenceStore } from "@/stores/presence-store";
import { useTypingStore } from "@/stores/typing-store";
import { initSocket, disconnectSocket } from "@/lib/socket";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = initSocket(accessToken);
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Presence events
    socket.on(ServerEvent.PRESENCE_CHANGED, ({ userId, status, customStatus }) => {
      usePresenceStore.getState().setPresence(userId, { status, customStatus });
    });

    socket.on(ServerEvent.PRESENCE_BULK, (entries) => {
      usePresenceStore.getState().setBulkPresence(entries);
    });

    // Typing events
    socket.on(ServerEvent.TYPING_START, ({ userId, channelId }) => {
      if (channelId) {
        useTypingStore.getState().addTypingUser(channelId, userId);
        // Auto-remove after 5 seconds
        setTimeout(() => {
          useTypingStore.getState().removeTypingUser(channelId, userId);
        }, 5000);
      }
    });

    socket.on(ServerEvent.TYPING_STOP, ({ userId, channelId }) => {
      if (channelId) {
        useTypingStore.getState().removeTypingUser(channelId, userId);
      }
    });

    socket.connect();

    return () => {
      disconnectSocket();
      setIsConnected(false);
    };
  }, [accessToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => useContext(SocketContext);
