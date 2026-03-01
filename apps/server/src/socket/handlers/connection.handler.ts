import { Server, Socket } from "socket.io";

import { ClientEvent, ServerEvent } from "@chat/shared";

import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";

export function registerConnectionHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  // Join user's private room for direct notifications
  socket.join(`user:${userId}`);

  // Join workspace room
  socket.on(ClientEvent.WORKSPACE_JOIN, async (workspaceId: string, callback?: (ack: { ok: boolean }) => void) => {
    try {
      // Verify membership
      if (!socket.data.workspaceIds?.includes(workspaceId)) {
        callback?.({ ok: false });
        return;
      }

      socket.join(`workspace:${workspaceId}`);
      logger.debug(`User ${userId} joined workspace ${workspaceId}`);

      // Broadcast presence
      socket.to(`workspace:${workspaceId}`).emit(ServerEvent.PRESENCE_CHANGED, {
        userId,
        status: "online",
      });

      // Update user status
      await prisma.user.update({
        where: { id: userId },
        data: { status: "ONLINE", lastSeenAt: new Date() },
      });

      callback?.({ ok: true });
    } catch (error) {
      logger.error("workspace:join error:", error);
      callback?.({ ok: false });
    }
  });

  socket.on(ClientEvent.WORKSPACE_LEAVE, (workspaceId: string) => {
    socket.leave(`workspace:${workspaceId}`);
  });

  // Join channel room
  socket.on(ClientEvent.CHANNEL_JOIN, async (channelId: string, callback?: (ack: { ok: boolean }) => void) => {
    try {
      socket.join(`channel:${channelId}`);
      logger.debug(`User ${userId} joined channel ${channelId}`);
      callback?.({ ok: true });
    } catch (error) {
      logger.error("channel:join error:", error);
      callback?.({ ok: false });
    }
  });

  socket.on(ClientEvent.CHANNEL_LEAVE, (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  // Join conversation room
  socket.on(ClientEvent.CONVERSATION_JOIN, async (conversationId: string, callback?: (ack: { ok: boolean }) => void) => {
    try {
      socket.join(`conversation:${conversationId}`);
      callback?.({ ok: true });
    } catch (error) {
      callback?.({ ok: false });
    }
  });

  socket.on(ClientEvent.CONVERSATION_LEAVE, (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Handle disconnect - update presence
  socket.on("disconnect", async () => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { status: "OFFLINE", lastSeenAt: new Date() },
      });

      // Broadcast offline status to all user's workspaces
      for (const workspaceId of socket.data.workspaceIds || []) {
        io.to(`workspace:${workspaceId}`).emit(ServerEvent.PRESENCE_CHANGED, {
          userId,
          status: "offline",
        });
      }
    } catch (error) {
      logger.error("disconnect handler error:", error);
    }
  });
}
