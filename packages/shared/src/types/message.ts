import { User } from "./user";

export type MessageType = "TEXT" | "SYSTEM" | "FILE";

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  authorId: string;
  author: User;
  channelId?: string | null;
  conversationId?: string | null;
  parentId?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  replyCount: number;
  lastReplyAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: FileAttachment[];
  reactions: MessageReaction[];
}

export interface FileAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  thumbnailUrl?: string | null;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}
