import { Socket } from "socket.io";

import { prisma } from "../../config/database";
import { verifyToken } from "../../utils/crypto";
import { logger } from "../../utils/logger";

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, deactivatedAt: true },
    });

    if (!user || user.deactivatedAt) {
      return next(new Error("User not found or deactivated"));
    }

    // Attach user data to socket
    socket.data.userId = user.id;

    // Get user's workspace memberships
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true },
    });

    socket.data.workspaceIds = memberships.map((m) => m.workspaceId);

    next();
  } catch (error) {
    logger.error("Socket auth error:", error);
    next(new Error("Authentication failed"));
  }
};
