import { NotificationType } from "@prisma/client";

import { prisma } from "../config/database";
import { logger } from "../utils/logger";

export class NotificationService {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    workspaceId?: string;
    channelId?: string;
    messageId?: string;
    resourceType?: string;
    resourceId?: string;
  }) {
    return prisma.notification.create({ data });
  }

  async createForMention(
    mentionedUserId: string,
    authorName: string,
    channelName: string,
    messageId: string,
    workspaceId: string,
    channelId: string,
  ) {
    return this.create({
      userId: mentionedUserId,
      type: "MENTION",
      title: `${authorName} mentioned you`,
      body: `in #${channelName}`,
      workspaceId,
      channelId,
      messageId,
    });
  }

  async createForDm(
    recipientId: string,
    senderName: string,
    messagePreview: string,
    messageId: string,
    workspaceId: string,
  ) {
    return this.create({
      userId: recipientId,
      type: "MESSAGE",
      title: `New message from ${senderName}`,
      body: messagePreview.slice(0, 100),
      workspaceId,
      messageId,
    });
  }

  async createForReaction(
    messageAuthorId: string,
    reactorName: string,
    emoji: string,
    messageId: string,
    workspaceId: string,
  ) {
    return this.create({
      userId: messageAuthorId,
      type: "REACTION",
      title: `${reactorName} reacted ${emoji}`,
      body: "to your message",
      workspaceId,
      messageId,
    });
  }

  async createForInvitation(
    userId: string,
    workspaceName: string,
    workspaceId: string,
    invitationId: string,
  ) {
    return this.create({
      userId,
      type: "INVITATION",
      title: "Workspace invitation",
      body: `You've been invited to ${workspaceName}`,
      workspaceId,
      resourceType: "invitation",
      resourceId: invitationId,
    });
  }

  async getUserNotifications(
    userId: string,
    options: { isRead?: boolean; limit?: number; cursor?: string } = {},
  ) {
    const limit = options.limit || 30;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(options.isRead !== undefined ? { isRead: options.isRead } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > limit;
    const data = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationService = new NotificationService();
