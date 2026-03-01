import { Server, Socket } from "socket.io";

import { ClientEvent, ServerEvent } from "@chat/shared";

export function registerTypingHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  socket.on(
    ClientEvent.TYPING_START,
    (data: { channelId?: string; conversationId?: string }) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit(ServerEvent.TYPING_START, {
          userId,
          channelId: data.channelId,
        });
      } else if (data.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit(ServerEvent.TYPING_START, {
          userId,
          conversationId: data.conversationId,
        });
      }
    },
  );

  socket.on(
    ClientEvent.TYPING_STOP,
    (data: { channelId?: string; conversationId?: string }) => {
      if (data.channelId) {
        socket.to(`channel:${data.channelId}`).emit(ServerEvent.TYPING_STOP, {
          userId,
          channelId: data.channelId,
        });
      } else if (data.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit(ServerEvent.TYPING_STOP, {
          userId,
          conversationId: data.conversationId,
        });
      }
    },
  );
}
