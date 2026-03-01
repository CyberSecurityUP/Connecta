import http from "http";
import { Server } from "socket.io";

import { ClientEvent, ServerEvent } from "@chat/shared";

import { config } from "../config";
import { logger } from "../utils/logger";

import { socketAuthMiddleware } from "./middleware/socketAuth";
import { registerConnectionHandlers } from "./handlers/connection.handler";
import { registerMessageHandlers } from "./handlers/message.handler";
import { registerTypingHandlers } from "./handlers/typing.handler";
import { registerPresenceHandlers } from "./handlers/presence.handler";

export function initializeSocketServer(httpServer: http.Server): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.data.userId})`);

    registerConnectionHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerPresenceHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on("error", (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
      socket.emit(ServerEvent.ERROR, { code: "INTERNAL_ERROR", message: "An error occurred" });
    });
  });

  return io;
}

// Export for use in services that need to emit events
let ioInstance: Server | null = null;

export function setIOInstance(io: Server) {
  ioInstance = io;
}

export function getIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized");
  }
  return ioInstance;
}
