export type NotificationType =
  | "MESSAGE"
  | "MENTION"
  | "REACTION"
  | "INVITATION"
  | "CHANNEL_UPDATE"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  resourceType?: string | null;
  resourceId?: string | null;
  workspaceId?: string | null;
  channelId?: string | null;
  messageId?: string | null;
  createdAt: string;
}
