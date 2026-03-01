import path from "path";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import routes from "./routes";

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use("/uploads", express.static(path.resolve(config.upload.dir)));

// Request logging
app.use(requestLogger);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1", routes);

// Global error handler
app.use(errorHandler);

export default app;
