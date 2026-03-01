"use client";

import { Search, Shield, ShieldOff, UserX, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

interface AdminUser {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string;
  isAdmin: boolean;
  status: string;
  createdAt: string;
  deactivatedAt: string | null;
  _count: { workspaceMemberships: number };
}

export default function AdminUsersPage() {
  const { accessToken, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = () => {
    if (!accessToken) return;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("search", search);

    apiClient
      .get<{ data: { users: AdminUser[]; total: number; totalPages: number } }>(
        `/admin/users?${params}`,
        { token: accessToken },
      )
      .then((res) => {
        setUsers(res.data.users);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [accessToken, page, search]);

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (!accessToken) return;
    try {
      await apiClient.patch(`/admin/users/${userId}/admin`, { isAdmin }, { token: accessToken });
      toast.success(isAdmin ? "User promoted to admin" : "Admin access revoked");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed");
    }
  };

  const handleToggleActive = async (userId: string, isDeactivated: boolean) => {
    if (!accessToken) return;
    try {
      const endpoint = isDeactivated ? "reactivate" : "deactivate";
      await apiClient.post(`/admin/users/${userId}/${endpoint}`, undefined, { token: accessToken });
      toast.success(isDeactivated ? "User reactivated" : "User deactivated");
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-muted-foreground">{total} total users</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="mt-6 rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Workspaces</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {(u.displayName || u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.displayName || u.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.isAdmin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <Shield className="h-3 w-3" /> Admin
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">User</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{u._count.workspaceMemberships}</td>
                  <td className="px-4 py-3">
                    {u.deactivatedAt ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Deactivated</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== currentUser?.id && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleAdmin(u.id, !u.isAdmin)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title={u.isAdmin ? "Remove admin" : "Make admin"}
                        >
                          {u.isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleToggleActive(u.id, !!u.deactivatedAt)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title={u.deactivatedAt ? "Reactivate" : "Deactivate"}
                        >
                          {u.deactivatedAt ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
