import { CreateChannelInput, UpdateChannelInput } from "@chat/shared";

import { prisma } from "../config/database";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";

export class ChannelService {
  async create(workspaceId: string, input: CreateChannelInput, userId: string) {
    // Generate slug from name
    const slug = input.name.toLowerCase().replace(/\s+/g, "-");

    const existing = await prisma.channel.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
    });

    if (existing) {
      throw new ConflictError("A channel with this name already exists in this workspace");
    }

    const channel = await prisma.$transaction(async (tx) => {
      const ch = await tx.channel.create({
        data: {
          workspaceId,
          name: input.name,
          slug,
          type: input.type || "PUBLIC",
          topic: input.topic,
          description: input.description,
          createdById: userId,
        },
      });

      // Auto-add creator as member
      await tx.channelMember.create({
        data: {
          channelId: ch.id,
          userId,
        },
      });

      return ch;
    });

    return channel;
  }

  async getWorkspaceChannels(workspaceId: string, userId: string, filter?: string) {
    const channels = await prisma.channel.findMany({
      where: {
        workspaceId,
        isArchived: false,
        ...(filter === "joined"
          ? { members: { some: { userId } } }
          : filter === "public"
            ? { type: "PUBLIC" }
            : {}),
      },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { userId },
          select: { id: true, isMuted: true, lastReadAt: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return channels.map((ch) => ({
      ...ch,
      memberCount: ch._count.members,
      isMember: ch.members.length > 0,
      isMuted: ch.members[0]?.isMuted ?? false,
      lastReadAt: ch.members[0]?.lastReadAt ?? null,
    }));
  }

  async getById(channelId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!channel) {
      throw new NotFoundError("Channel");
    }

    return {
      ...channel,
      memberCount: channel._count.members,
    };
  }

  async update(channelId: string, input: UpdateChannelInput) {
    return prisma.channel.update({
      where: { id: channelId },
      data: {
        ...input,
        ...(input.name ? { slug: input.name.toLowerCase().replace(/\s+/g, "-") } : {}),
      },
    });
  }

  async archive(channelId: string) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundError("Channel");
    if (channel.isDefault) throw new ForbiddenError("Cannot archive a default channel");

    return prisma.channel.update({
      where: { id: channelId },
      data: { isArchived: true },
    });
  }

  async join(channelId: string, userId: string) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundError("Channel");
    if (channel.type === "PRIVATE") {
      throw new ForbiddenError("Cannot join a private channel without an invitation");
    }

    const existing = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });

    if (existing) return existing;

    return prisma.channelMember.create({
      data: { channelId, userId },
    });
  }

  async leave(channelId: string, userId: string) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundError("Channel");
    if (channel.isDefault) throw new ForbiddenError("Cannot leave a default channel");

    await prisma.channelMember.delete({
      where: { channelId_userId: { channelId, userId } },
    });
  }

  async getMembers(channelId: string) {
    return prisma.channelMember.findMany({
      where: { channelId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
            status: true,
            customStatus: true,
          },
        },
      },
    });
  }

  async addMembers(channelId: string, userIds: string[]) {
    const data = userIds.map((userId) => ({ channelId, userId }));
    await prisma.channelMember.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async removeMember(channelId: string, userId: string) {
    await prisma.channelMember.delete({
      where: { channelId_userId: { channelId, userId } },
    });
  }
}

export const channelService = new ChannelService();
