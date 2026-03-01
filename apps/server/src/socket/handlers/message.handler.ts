import { Server, Socket } from "socket.io";

import { ClientEvent, ServerEvent } from "@chat/shared";

import { messageService } from "../../services/message.service";
import { logger } from "../../utils/logger";

export function registerMessageHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  // Send message via socket
  socket.on(
    ClientEvent.MESSAGE_SEND,
    async (
      data: { channelId?: string; conversationId?: string; content: string; parentId?: string },
      callback?: (ack: { ok: boolean; data?: unknown }) => void,
    ) => {
      try {
        if (data.channelId) {
          const message = await messageService.create(
            data.channelId,
            { content: data.content, parentId: data.parentId },
            userId,
          );

          // Broadcast to channel room
          io.to(`channel:${data.channelId}`).emit(ServerEvent.MESSAGE_NEW, message);

          // If it's a thread reply, also emit thread event
          if (data.parentId) {
            io.to(`channel:${data.channelId}`).emit(ServerEvent.THREAD_NEW_REPLY, {
              parentId: data.parentId,
              message,
              replyCount: message.replyCount,
            });
          }

          callback?.({ ok: true, data: message });
        }
      } catch (error) {
        logger.error("message:send error:", error);
        callback?.({ ok: false });
      }
    },
  );

  // Edit message
  socket.on(
    ClientEvent.MESSAGE_EDIT,
    async (
      data: { messageId: string; content: string },
      callback?: (ack: { ok: boolean }) => void,
    ) => {
      try {
        const message = await messageService.update(
          data.messageId,
          { content: data.content },
          userId,
        );

        // Broadcast to the channel/conversation room
        if (message.channelId) {
          io.to(`channel:${message.channelId}`).emit(ServerEvent.MESSAGE_UPDATED, message);
        }

        callback?.({ ok: true });
      } catch (error) {
        logger.error("message:edit error:", error);
        callback?.({ ok: false });
      }
    },
  );

  // Delete message
  socket.on(
    ClientEvent.MESSAGE_DELETE,
    async (
      data: { messageId: string },
      callback?: (ack: { ok: boolean }) => void,
    ) => {
      try {
        const message = await messageService.delete(data.messageId, userId);

        if (message.channelId) {
          io.to(`channel:${message.channelId}`).emit(ServerEvent.MESSAGE_DELETED, {
            messageId: data.messageId,
            channelId: message.channelId,
          });
        }

        callback?.({ ok: true });
      } catch (error) {
        logger.error("message:delete error:", error);
        callback?.({ ok: false });
      }
    },
  );

  // Add reaction
  socket.on(
    ClientEvent.REACTION_ADD,
    async (
      data: { messageId: string; emoji: string },
      callback?: (ack: { ok: boolean }) => void,
    ) => {
      try {
        const reactions = await messageService.addReaction(data.messageId, data.emoji, userId);

        // We need the channelId to broadcast - get it from the message
        // The reactions are broadcast to the relevant room
        socket.emit(ServerEvent.REACTION_ADDED, {
          messageId: data.messageId,
          reaction: { emoji: data.emoji, userId },
        });

        callback?.({ ok: true });
      } catch (error) {
        logger.error("reaction:add error:", error);
        callback?.({ ok: false });
      }
    },
  );

  // Remove reaction
  socket.on(
    ClientEvent.REACTION_REMOVE,
    async (
      data: { messageId: string; emoji: string },
      callback?: (ack: { ok: boolean }) => void,
    ) => {
      try {
        await messageService.removeReaction(data.messageId, data.emoji, userId);

        socket.emit(ServerEvent.REACTION_REMOVED, {
          messageId: data.messageId,
          emoji: data.emoji,
          userId,
        });

        callback?.({ ok: true });
      } catch (error) {
        logger.error("reaction:remove error:", error);
        callback?.({ ok: false });
      }
    },
  );
}
