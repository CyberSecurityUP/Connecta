import { RequestHandler } from "express";

import { WorkspaceRole } from "@chat/shared";

import { prisma } from "../config/database";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../utils/errors";

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  GUEST: 1,
};

export function authorize(requiredRole: WorkspaceRole): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!req.userId) {
        throw new UnauthorizedError();
      }

      const workspaceId = req.params.workspaceId;
      if (!workspaceId) {
        throw new NotFoundError("Workspace");
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.userId,
          },
        },
      });

      if (!member) {
        throw new ForbiddenError("You are not a member of this workspace");
      }

      if (ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[requiredRole]) {
        throw new ForbiddenError("Insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
