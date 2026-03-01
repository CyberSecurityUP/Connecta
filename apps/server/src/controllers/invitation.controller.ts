import { Request, Response, NextFunction } from "express";
import { invitationService } from "../services/invitation.service";
import { prisma } from "../config/database";

export class InvitationController {
  async getByToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
          invitedBy: { select: { id: true, name: true, displayName: true } },
        },
      });

      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      if (invitation.status !== "PENDING") {
        return res.status(409).json({ error: "Invitation already used" });
      }

      if (new Date() > invitation.expiresAt) {
        return res.status(403).json({ error: "Invitation expired" });
      }

      res.json({
        data: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          workspace: invitation.workspace,
          invitedBy: invitation.invitedBy,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const userId = req.userId!;

      const invitation = await invitationService.accept(token, userId);

      const workspace = await prisma.workspace.findUnique({
        where: { id: invitation.workspaceId },
        select: { slug: true, name: true },
      });

      res.json({
        data: {
          message: "Invitation accepted",
          workspace,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const invitationController = new InvitationController();
