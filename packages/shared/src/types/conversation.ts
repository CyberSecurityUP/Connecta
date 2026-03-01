import { Message } from "./message";
import { User } from "./user";

export type ConversationType = "DIRECT" | "GROUP";

export interface Conversation {
  id: string;
  workspaceId: string;
  type: ConversationType;
  name?: string | null;
  participants: User[];
  lastMessage?: Message | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  isMuted: boolean;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  joinedAt: string;
}
