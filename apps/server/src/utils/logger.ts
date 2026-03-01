import winston from "winston";

import { config } from "../config";

export const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    config.nodeEnv === "production"
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  ),
  defaultMeta: { service: "chat-server" },
  transports: [new winston.transports.Console()],
});
