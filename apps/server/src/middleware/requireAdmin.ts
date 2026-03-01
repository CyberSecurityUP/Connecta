import { RequestHandler } from "express";
import { prisma } from "../config/database";
import { ForbiddenError } from "../utils/errors";

export const requireAdmin: RequestHandler = async (req, _res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      throw new ForbiddenError("Admin access required");
    }

    next();
  } catch (error) {
    next(error);
  }
};
