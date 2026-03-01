"use client";

import { MoreHorizontal, Search, Shield, UserMinus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { WorkspaceMember, WorkspaceRole } from "@chat/shared";

import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function MembersSettingsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { accessToken } = useAuthStore();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (ws) {
          setWorkspaceId(ws.id);
          return apiClient
            .get<{ data: WorkspaceMember[] }>(`/workspaces/${ws.id}/members`, { token: accessToken })
            .then((mRes) => setMembers(mRes.data));
        }
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, workspaceSlug]);

  const handleRoleChange = async (userId: string, role: WorkspaceRole) => {
    if (!workspaceId || !accessToken) return;
    try {
      await apiClient.patch(`/workspaces/${workspaceId}/members/${userId}`, { role }, { token: accessToken });
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role } : m)),
      );
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
    setOpenMenuId(null);
  };

  const handleRemove = async (userId: string) => {
    if (!workspaceId || !accessToken) return;
    if (!confirm("Remove this member?")) return;
    try {
      await apiClient.delete(`/workspaces/${workspaceId}/members/${userId}`, { token: accessToken });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success("Member removed");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.user.name?.toLowerCase().includes(q) ||
      m.user.displayName?.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q)
    );
  });

  const roleBadgeColor: Record<string, string> = {
    OWNER: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    MEMBER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    GUEST: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="mt-1 text-muted-foreground">{members.length} members in this workspace</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-lg border px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search members..."
          className="flex-1 bg-transparent text-sm outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 divide-y rounded-lg border">
        {filtered.map((member) => (
          <div key={member.userId} className="flex items-center gap-4 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {(member.user.displayName || member.user.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{member.user.displayName || member.user.name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", roleBadgeColor[member.role])}>
                  {member.role}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
            </div>

            {member.role !== "OWNER" && (
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === member.userId ? null : member.userId)}
                  className="rounded-md p-1.5 hover:bg-accent"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {openMenuId === member.userId && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border bg-popover py-1 shadow-lg">
                    <button
                      onClick={() => handleRoleChange(member.userId, "ADMIN")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Shield className="h-4 w-4" /> Make Admin
                    </button>
                    <button
                      onClick={() => handleRoleChange(member.userId, "MEMBER")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Shield className="h-4 w-4" /> Make Member
                    </button>
                    <button
                      onClick={() => handleRoleChange(member.userId, "GUEST")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Shield className="h-4 w-4" /> Make Guest
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => handleRemove(member.userId)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                    >
                      <UserMinus className="h-4 w-4" /> Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
