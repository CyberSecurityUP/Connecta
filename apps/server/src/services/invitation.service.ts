import { prisma } from "../config/database";
import { ConflictError, NotFoundError, ForbiddenError } from "../utils/errors";

export class InvitationService {
  async create(
    workspaceId: string,
    emails: string[],
    role: "ADMIN" | "MEMBER" | "GUEST",
    invitedById: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const results = [];

    for (const email of emails) {
      // Check if already a member
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        const existingMember = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: { workspaceId, userId: existingUser.id },
          },
        });
        if (existingMember) continue; // Skip already-member
      }

      // Check if pending invitation exists
      const existingInvite = await prisma.invitation.findFirst({
        where: { workspaceId, email, status: "PENDING" },
      });
      if (existingInvite) continue;

      const invitation = await prisma.invitation.create({
        data: { workspaceId, email, role, invitedById, expiresAt },
      });
      results.push(invitation);
    }

    return results;
  }

  async accept(token: string, userId: string) {
    const invitation = await prisma.invitation.findUnique({ where: { token } });

    if (!invitation) throw new NotFoundError("Invitation");
    if (invitation.status !== "PENDING") throw new ConflictError("Invitation already used");
    if (new Date() > invitation.expiresAt) throw new ForbiddenError("Invitation expired");

    // Get user email to verify
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User");

    // Accept and add to workspace
    await prisma.$transaction(async (tx) => {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      });

      // Auto-join default channels
      const defaultChannels = await tx.channel.findMany({
        where: { workspaceId: invitation.workspaceId, isDefault: true },
      });

      if (defaultChannels.length > 0) {
        await tx.channelMember.createMany({
          data: defaultChannels.map((ch) => ({ channelId: ch.id, userId })),
          skipDuplicates: true,
        });
      }
    });

    return invitation;
  }

  async listPending(workspaceId: string) {
    return prisma.invitation.findMany({
      where: { workspaceId, status: "PENDING" },
      include: {
        invitedBy: {
          select: { id: true, name: true, displayName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revoke(invitationId: string) {
    return prisma.invitation.delete({ where: { id: invitationId } });
  }
}

export const invitationService = new InvitationService();
