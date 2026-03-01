import { User } from "./user";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  domain?: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  nickname?: string | null;
  joinedAt: string;
  user: User;
}

export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED";
  token: string;
  expiresAt: string;
  createdAt: string;
}
