import { CreateMessageInput, UpdateMessageInput } from "@chat/shared";

import { prisma } from "../config/database";
import { ForbiddenError, NotFoundError } from "../utils/errors";
import { webhookService } from "./webhook.service";

export class MessageService {
  async create(
    channelId: string,
    input: CreateMessageInput,
    authorId: string,
  ) {
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          content: input.content,
          channelId,
          authorId,
          parentId: input.parentId || null,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              displayName: true,
              email: true,
              image: true,
              status: true,
            },
          },
          reactions: true,
          attachments: true,
        },
      });

      // If this is a thread reply, update parent's reply count
      if (input.parentId) {
        await tx.message.update({
          where: { id: input.parentId },
          data: {
            replyCount: { increment: 1 },
            lastReplyAt: new Date(),
          },
        });
      }

      // Link attachments if provided
      if (input.attachmentIds?.length) {
        await tx.file.updateMany({
          where: { id: { in: input.attachmentIds } },
          data: { messageId: msg.id },
        });
      }

      return msg;
    });

    // Trigger webhook
    if (message.channelId) {
      const channel = await prisma.channel.findUnique({ where: { id: message.channelId }, select: { workspaceId: true } });
      if (channel) {
        webhookService.trigger(channel.workspaceId, "MESSAGE_CREATED", {
          message: { id: message.id, content: message.content, authorId: message.authorId, channelId: message.channelId, createdAt: message.createdAt },
        });
      }
    }

    return this.formatMessage(message);
  }

  async getChannelMessages(
    channelId: string,
    cursor?: string,
    limit = 50,
  ) {
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        parentId: null, // Only top-level messages
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
            status: true,
          },
        },
        reactions: true,
        attachments: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: data.map(this.formatMessage),
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  async getThreadReplies(
    parentId: string,
    cursor?: string,
    limit = 50,
  ) {
    const messages = await prisma.message.findMany({
      where: {
        parentId,
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
            status: true,
          },
        },
        reactions: true,
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: data.map(this.formatMessage),
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  async update(messageId: string, input: UpdateMessageInput, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundError("Message");
    if (message.authorId !== userId) throw new ForbiddenError("You can only edit your own messages");

    return prisma.message.update({
      where: { id: messageId },
      data: {
        content: input.content,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
            status: true,
          },
        },
        reactions: true,
        attachments: true,
      },
    });
  }

  async delete(messageId: string, userId: string, isAdmin = false) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundError("Message");
    if (message.authorId !== userId && !isAdmin) {
      throw new ForbiddenError("You can only delete your own messages");
    }

    return prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "",
      },
    });
  }

  async addReaction(messageId: string, emoji: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundError("Message");

    await prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
      update: {},
      create: { messageId, userId, emoji },
    });

    return this.getReactions(messageId);
  }

  async removeReaction(messageId: string, emoji: string, userId: string) {
    await prisma.reaction.deleteMany({
      where: { messageId, userId, emoji },
    });

    return this.getReactions(messageId);
  }

  private async getReactions(messageId: string) {
    const reactions = await prisma.reaction.findMany({
      where: { messageId },
    });

    // Group by emoji
    const grouped = reactions.reduce(
      (acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = [];
        acc[r.emoji].push(r.userId);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    return Object.entries(grouped).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      userIds,
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatMessage(message: any) {
    // Group reactions by emoji
    const reactions = message.reactions?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc: any[], r: any) => {
        const existing = acc.find((a) => a.emoji === r.emoji);
        if (existing) {
          existing.count++;
          existing.userIds.push(r.userId);
        } else {
          acc.push({ emoji: r.emoji, count: 1, userIds: [r.userId] });
        }
        return acc;
      },
      [] as { emoji: string; count: number; userIds: string[] }[],
    ) ?? [];

    return {
      id: message.id,
      content: message.content,
      type: message.type,
      authorId: message.authorId,
      author: message.author,
      channelId: message.channelId,
      conversationId: message.conversationId,
      parentId: message.parentId,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      replyCount: message.replyCount,
      lastReplyAt: message.lastReplyAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      attachments: message.attachments ?? [],
      reactions,
    };
  }
}

export const messageService = new MessageService();
