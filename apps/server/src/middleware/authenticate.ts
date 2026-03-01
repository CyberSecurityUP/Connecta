import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { config } from "../config";
import { prisma } from "../config/database";
import { UnauthorizedError } from "../utils/errors";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Missing or invalid authorization header");
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.auth.secret) as { userId: string };

    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, deactivatedAt: true },
    });

    if (!user || user.deactivatedAt) {
      throw new UnauthorizedError("User not found or deactivated");
    }

    req.userId = user.id;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError("Invalid or expired token"));
    }
  }
};
