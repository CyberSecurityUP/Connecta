import { Server, Socket } from "socket.io";

import { ClientEvent, ServerEvent } from "@chat/shared";

import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";

export function registerPresenceHandlers(io: Server, socket: Socket) {
  const userId = socket.data.userId;

  socket.on(
    ClientEvent.PRESENCE_UPDATE,
    async (data: { status: "online" | "away" | "dnd"; customStatus?: string }) => {
      try {
        const statusMap: Record<string, "ONLINE" | "AWAY" | "DND"> = {
          online: "ONLINE",
          away: "AWAY",
          dnd: "DND",
        };

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: statusMap[data.status] || "ONLINE",
            customStatus: data.customStatus ?? null,
            lastSeenAt: new Date(),
          },
        });

        // Broadcast to all workspaces
        for (const workspaceId of socket.data.workspaceIds || []) {
          io.to(`workspace:${workspaceId}`).emit(ServerEvent.PRESENCE_CHANGED, {
            userId,
            status: data.status,
            customStatus: data.customStatus,
          });
        }
      } catch (error) {
        logger.error("presence:update error:", error);
      }
    },
  );

  // Heartbeat to keep presence alive
  socket.on(ClientEvent.PRESENCE_HEARTBEAT, async () => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      });
    } catch (error) {
      // Silent fail for heartbeats
    }
  });
}
