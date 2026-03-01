import { ErrorRequestHandler } from "express";

import { AppError, ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
    return;
  }

  // Unexpected errors
  logger.error("Unhandled error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
