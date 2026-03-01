import { prisma } from "../config/database";
import { NotFoundError } from "../utils/errors";

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        phone: true,
        title: true,
        bio: true,
        timezone: true,
        status: true,
        customStatus: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundError("User");
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      title?: string;
      bio?: string;
      phone?: string;
      timezone?: string;
    },
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        phone: true,
        title: true,
        bio: true,
        timezone: true,
        status: true,
        customStatus: true,
        createdAt: true,
      },
    });
  }

  async updateStatus(userId: string, status: string, customStatus?: string) {
    const statusMap: Record<string, "ONLINE" | "AWAY" | "DND" | "OFFLINE"> = {
      online: "ONLINE",
      away: "AWAY",
      dnd: "DND",
      offline: "OFFLINE",
    };

    return prisma.user.update({
      where: { id: userId },
      data: {
        status: statusMap[status] || "ONLINE",
        customStatus: customStatus ?? null,
        lastSeenAt: new Date(),
      },
    });
  }

  async updateAvatar(userId: string, imageUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: { id: true, image: true },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const { hashPassword, verifyPassword } = await import("../utils/crypto");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) throw new NotFoundError("User");

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) throw new Error("Current password is incorrect");

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }
}

export const userService = new UserService();
