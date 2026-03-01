import http from "http";

import app from "./app";
import { config } from "./config";
import { initializeSocketServer, setIOInstance } from "./socket";
import { logger } from "./utils/logger";

const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocketServer(server);
setIOInstance(io);

const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Socket.io attached`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info("Shutting down gracefully...");

  io.close(() => {
    logger.info("Socket.io server closed");
  });

  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
