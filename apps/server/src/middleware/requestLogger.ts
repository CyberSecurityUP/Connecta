import { RequestHandler } from "express";

import { logger } from "../utils/logger";

export const requestLogger: RequestHandler = (req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
};
