import { Prisma } from "@prisma/client";

import { prisma } from "../config/database";

export class SearchService {
  async searchMessages(
    workspaceId: string,
    userId: string,
    query: string,
    options: {
      channelId?: string;
      authorId?: string;
      before?: string;
      after?: string;
      hasFile?: boolean;
      limit?: number;
      cursor?: string;
    } = {},
  ) {
    const limit = options.limit || 20;

    // Get channels the user is a member of
    const userChannels = await prisma.channelMember.findMany({
      where: { userId, channel: { workspaceId } },
      select: { channelId: true },
    });
    const channelIds = userChannels.map((c) => c.channelId);

    // Get conversations the user participates in
    const userConversations = await prisma.conversationParticipant.findMany({
      where: { userId, conversation: { workspaceId } },
      select: { conversationId: true },
    });
    const conversationIds = userConversations.map((c) => c.conversationId);

    const where: Prisma.MessageWhereInput = {
      isDeleted: false,
      content: { contains: query, mode: "insensitive" },
      OR: [
        { channelId: { in: options.channelId ? [options.channelId] : channelIds } },
        { conversationId: { in: conversationIds } },
      ],
      ...(options.authorId ? { authorId: options.authorId } : {}),
      ...(options.before ? { createdAt: { lte: new Date(options.before) } } : {}),
      ...(options.after ? { createdAt: { gte: new Date(options.after) } } : {}),
      ...(options.hasFile ? { attachments: { some: {} } } : {}),
    };

    const messages = await prisma.message.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
          },
        },
        channel: { select: { id: true, name: true, slug: true } },
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return {
      data: data.map((msg) => ({
        id: msg.id,
        content: msg.content,
        authorId: msg.authorId,
        author: msg.author,
        channelId: msg.channelId,
        channelName: msg.channel?.name,
        channelSlug: msg.channel?.slug,
        conversationId: msg.conversationId,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
        highlight: this.highlightMatch(msg.content, query),
      })),
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  async searchChannels(workspaceId: string, query: string) {
    return prisma.channel.findMany({
      where: {
        workspaceId,
        isArchived: false,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { topic: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { _count: { select: { members: true } } },
      take: 20,
      orderBy: { name: "asc" },
    });
  }

  async searchMembers(workspaceId: string, query: string) {
    return prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        user: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { displayName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
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
          },
        },
      },
      take: 20,
    });
  }

  async searchFiles(workspaceId: string, query: string, cursor?: string, limit = 20) {
    const files = await prisma.file.findMany({
      where: {
        workspaceId,
        name: { contains: query, mode: "insensitive" },
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, displayName: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = files.length > limit;
    const data = hasMore ? files.slice(0, limit) : files;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  private highlightMatch(content: string, query: string): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return content.slice(0, 150);

    const start = Math.max(0, index - 40);
    const end = Math.min(content.length, index + query.length + 40);
    let snippet = content.slice(start, end);

    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return snippet;
  }
}

export const searchService = new SearchService();
