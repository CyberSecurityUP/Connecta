import { prisma } from "../config/database";
import { NotFoundError } from "../utils/errors";

export class AdminService {
  // Dashboard stats
  async getStats() {
    const [userCount, workspaceCount, channelCount, messageCount, fileCount] = await Promise.all([
      prisma.user.count(),
      prisma.workspace.count(),
      prisma.channel.count(),
      prisma.message.count({ where: { isDeleted: false } }),
      prisma.file.count(),
    ]);

    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    });

    const recentMessages = await prisma.message.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, isDeleted: false },
    });

    return {
      users: { total: userCount, lastWeek: recentUsers },
      workspaces: { total: workspaceCount },
      channels: { total: channelCount },
      messages: { total: messageCount, last24h: recentMessages },
      files: { total: fileCount },
    };
  }

  // User management
  async listUsers(page = 1, limit = 25, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          displayName: true,
          email: true,
          isAdmin: true,
          status: true,
          createdAt: true,
          deactivatedAt: true,
          _count: { select: { workspaceMemberships: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserAdmin(userId: string, isAdmin: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User");
    return prisma.user.update({ where: { id: userId }, data: { isAdmin } });
  }

  async deactivateUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User");
    return prisma.user.update({
      where: { id: userId },
      data: { deactivatedAt: new Date() },
    });
  }

  async reactivateUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User");
    return prisma.user.update({
      where: { id: userId },
      data: { deactivatedAt: null },
    });
  }

  // Workspace management
  async listWorkspaces(page = 1, limit = 25, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [workspaces, total] = await Promise.all([
      prisma.workspace.findMany({
        where,
        include: {
          _count: { select: { members: true, channels: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workspace.count({ where }),
    ]);

    return { workspaces, total, page, totalPages: Math.ceil(total / limit) };
  }

  async deleteWorkspace(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundError("Workspace");
    return prisma.workspace.delete({ where: { id: workspaceId } });
  }

  async getWorkspaceDetail(workspaceId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: { select: { members: true, channels: true, files: true, conversations: true } },
        members: {
          include: { user: { select: { id: true, name: true, displayName: true, email: true } } },
          orderBy: { joinedAt: "desc" },
          take: 50,
        },
      },
    });
    if (!workspace) throw new NotFoundError("Workspace");
    return workspace;
  }
}

export const adminService = new AdminService();
