export type ChannelType = "PUBLIC" | "PRIVATE" | "ANNOUNCEMENT";

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  type: ChannelType;
  topic?: string | null;
  description?: string | null;
  createdById?: string | null;
  memberCount: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  isMuted: boolean;
  lastReadMessageId?: string | null;
  lastReadAt?: string | null;
  joinedAt: string;
}
