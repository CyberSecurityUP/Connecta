import { CreateWorkspaceInput, UpdateWorkspaceInput } from "@chat/shared";

import { prisma } from "../config/database";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";

export class WorkspaceService {
  async create(input: CreateWorkspaceInput, userId: string) {
    // Check if slug is already taken
    const existing = await prisma.workspace.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new ConflictError("A workspace with this URL already exists");
    }

    // Create workspace, add creator as owner, and create default channels in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
        },
      });

      // Add creator as OWNER
      await tx.workspaceMember.create({
        data: {
          workspaceId: ws.id,
          userId,
          role: "OWNER",
        },
      });

      // Create #general channel
      const generalChannel = await tx.channel.create({
        data: {
          workspaceId: ws.id,
          name: "general",
          slug: "general",
          topic: "General discussion for the team",
          type: "PUBLIC",
          isDefault: true,
          createdById: userId,
        },
      });

      // Create #random channel
      const randomChannel = await tx.channel.create({
        data: {
          workspaceId: ws.id,
          name: "random",
          slug: "random",
          topic: "Non-work chatter and fun stuff",
          type: "PUBLIC",
          isDefault: true,
          createdById: userId,
        },
      });

      // Add owner to default channels
      await tx.channelMember.createMany({
        data: [
          { channelId: generalChannel.id, userId },
          { channelId: randomChannel.id, userId },
        ],
      });

      return ws;
    });

    return workspace;
  }

  async getUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      memberCount: m.workspace._count.members,
      role: m.role,
    }));
  }

  async getById(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: { select: { members: true, channels: true } },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    return {
      ...workspace,
      memberCount: workspace._count.members,
      channelCount: workspace._count.channels,
    };
  }

  async getBySlug(slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        _count: { select: { members: true, channels: true } },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace");
    }

    return {
      ...workspace,
      memberCount: workspace._count.members,
      channelCount: workspace._count.channels,
    };
  }

  async update(workspaceId: string, input: UpdateWorkspaceInput) {
    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: input,
    });

    return workspace;
  }

  async delete(workspaceId: string, userId: string) {
    // Only OWNER can delete
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!member || member.role !== "OWNER") {
      throw new ForbiddenError("Only the workspace owner can delete it");
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }

  async getMembers(workspaceId: string, search?: string) {
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        ...(search
          ? {
              user: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { displayName: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
            title: true,
            status: true,
            customStatus: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return members;
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    role: "ADMIN" | "MEMBER" | "GUEST",
  ) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
    });

    if (!member) {
      throw new NotFoundError("Member");
    }

    if (member.role === "OWNER") {
      throw new ForbiddenError("Cannot change the owner's role");
    }

    return prisma.workspaceMember.update({
      where: { id: member.id },
      data: { role },
    });
  }

  async removeMember(workspaceId: string, targetUserId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUserId },
      },
    });

    if (!member) {
      throw new NotFoundError("Member");
    }

    if (member.role === "OWNER") {
      throw new ForbiddenError("Cannot remove the workspace owner");
    }

    // Also remove from all channels in this workspace
    await prisma.$transaction([
      prisma.channelMember.deleteMany({
        where: {
          userId: targetUserId,
          channel: { workspaceId },
        },
      }),
      prisma.workspaceMember.delete({
        where: { id: member.id },
      }),
    ]);
  }

  async leave(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!member) {
      throw new NotFoundError("Membership");
    }

    if (member.role === "OWNER") {
      throw new ForbiddenError("Owner cannot leave. Transfer ownership first.");
    }

    await prisma.$transaction([
      prisma.channelMember.deleteMany({
        where: {
          userId,
          channel: { workspaceId },
        },
      }),
      prisma.workspaceMember.delete({
        where: { id: member.id },
      }),
    ]);
  }
}

export const workspaceService = new WorkspaceService();
