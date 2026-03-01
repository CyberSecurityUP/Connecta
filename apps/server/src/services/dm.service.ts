import { CreateMessageInput } from "@chat/shared";

import { prisma } from "../config/database";
import { ConflictError, ForbiddenError, NotFoundError } from "../utils/errors";

export class DmService {
  async createOrGetConversation(
    workspaceId: string,
    participantIds: string[],
    userId: string,
    name?: string,
  ) {
    // Ensure creator is included
    const allParticipants = [...new Set([userId, ...participantIds])];

    if (allParticipants.length < 2) {
      throw new ForbiddenError("A conversation needs at least 2 participants");
    }

    const type = allParticipants.length === 2 ? "DIRECT" : "GROUP";

    // For 1:1 DMs, check if conversation already exists
    if (type === "DIRECT") {
      const existing = await prisma.conversation.findFirst({
        where: {
          workspaceId,
          type: "DIRECT",
          AND: allParticipants.map((id) => ({
            participants: { some: { userId: id } },
          })),
        },
        include: {
          participants: {
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
          },
        },
      });

      if (existing) {
        return {
          ...existing,
          participants: existing.participants.map((p) => p.user),
        };
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        workspaceId,
        type,
        name: type === "GROUP" ? name : null,
        participants: {
          create: allParticipants.map((id) => ({ userId: id })),
        },
      },
      include: {
        participants: {
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
        },
      },
    });

    return {
      ...conversation,
      participants: conversation.participants.map((p) => p.user),
    };
  }

  async getUserConversations(workspaceId: string, userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        workspaceId,
        participants: { some: { userId } },
      },
      include: {
        participants: {
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
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            author: {
              select: { id: true, name: true, displayName: true, image: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      workspaceId: conv.workspaceId,
      type: conv.type,
      name: conv.name,
      participants: conv.participants.map((p) => p.user),
      lastMessage: conv.messages[0] || null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
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
        },
      },
    });

    if (!conversation) throw new NotFoundError("Conversation");

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) throw new ForbiddenError("Not a participant");

    return {
      ...conversation,
      participants: conversation.participants.map((p) => p.user),
    };
  }

  async getMessages(conversationId: string, cursor?: string, limit = 50) {
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        parentId: null,
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
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: data.map(this.formatMessage),
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  async sendMessage(conversationId: string, input: CreateMessageInput, authorId: string) {
    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          content: input.content,
          conversationId,
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

      // Update conversation timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      if (input.parentId) {
        await tx.message.update({
          where: { id: input.parentId },
          data: { replyCount: { increment: 1 }, lastReplyAt: new Date() },
        });
      }

      return msg;
    });

    return this.formatMessage(message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatMessage(message: any) {
    const reactions =
      message.reactions?.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (acc: any[], r: any) => {
          const existing = acc.find((a: any) => a.emoji === r.emoji);
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

export const dmService = new DmService();
