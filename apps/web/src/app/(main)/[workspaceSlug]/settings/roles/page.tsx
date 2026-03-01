"use client";

import { Check, X } from "lucide-react";

import { PERMISSIONS, WorkspaceRole } from "@chat/shared";

const roles: WorkspaceRole[] = ["OWNER", "ADMIN", "MEMBER", "GUEST"];

const permissionGroups = [
  {
    name: "Workspace",
    permissions: [
      { key: "WORKSPACE_UPDATE", label: "Edit workspace settings" },
      { key: "WORKSPACE_DELETE", label: "Delete workspace" },
      { key: "WORKSPACE_INVITE", label: "Invite members" },
    ],
  },
  {
    name: "Members",
    permissions: [
      { key: "MEMBER_MANAGE", label: "Manage members" },
      { key: "MEMBER_REMOVE", label: "Remove members" },
      { key: "ROLE_ASSIGN", label: "Assign roles" },
    ],
  },
  {
    name: "Channels",
    permissions: [
      { key: "CHANNEL_CREATE", label: "Create channels" },
      { key: "CHANNEL_DELETE", label: "Delete channels" },
      { key: "CHANNEL_MANAGE_MEMBERS", label: "Manage channel members" },
    ],
  },
  {
    name: "Messages",
    permissions: [
      { key: "MESSAGE_SEND", label: "Send messages" },
      { key: "MESSAGE_DELETE_ANY", label: "Delete any message" },
      { key: "MESSAGE_PIN", label: "Pin messages" },
    ],
  },
];

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  GUEST: 1,
};

function hasPermission(role: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[requiredRole];
}

export default function RolesPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Roles & Permissions</h1>
      <p className="mt-1 text-muted-foreground">
        View the permissions for each role in this workspace
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="pb-3 pr-4 text-left text-sm font-medium text-muted-foreground">
                Permission
              </th>
              {roles.map((role) => (
                <th key={role} className="pb-3 px-4 text-center text-sm font-medium">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                    {role}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionGroups.map((group) => (
              <>
                <tr key={group.name}>
                  <td
                    colSpan={5}
                    className="pb-2 pt-6 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {group.name}
                  </td>
                </tr>
                {group.permissions.map((perm) => {
                  const required = PERMISSIONS[perm.key as keyof typeof PERMISSIONS];
                  return (
                    <tr key={perm.key} className="border-b">
                      <td className="py-3 pr-4 text-sm">{perm.label}</td>
                      {roles.map((role) => (
                        <td key={role} className="px-4 py-3 text-center">
                          {hasPermission(role, required) ? (
                            <Check className="mx-auto h-4 w-4 text-green-600" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
