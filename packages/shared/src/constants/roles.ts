import { WorkspaceRole } from "../types/workspace";

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  GUEST: 1,
};

export function hasPermission(userRole: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export const PERMISSIONS = {
  // Workspace
  WORKSPACE_UPDATE: "ADMIN" as WorkspaceRole,
  WORKSPACE_DELETE: "OWNER" as WorkspaceRole,
  WORKSPACE_INVITE: "ADMIN" as WorkspaceRole,

  // Members
  MEMBER_MANAGE: "ADMIN" as WorkspaceRole,
  MEMBER_REMOVE: "ADMIN" as WorkspaceRole,
  ROLE_ASSIGN: "OWNER" as WorkspaceRole,

  // Channels
  CHANNEL_CREATE: "MEMBER" as WorkspaceRole,
  CHANNEL_DELETE: "ADMIN" as WorkspaceRole,
  CHANNEL_MANAGE_MEMBERS: "ADMIN" as WorkspaceRole,

  // Messages
  MESSAGE_SEND: "GUEST" as WorkspaceRole,
  MESSAGE_DELETE_ANY: "ADMIN" as WorkspaceRole,
  MESSAGE_PIN: "MEMBER" as WorkspaceRole,
} as const;
