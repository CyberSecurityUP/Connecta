"use client";

import { Search, Trash2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  _count: { members: number; channels: number };
}

export default function AdminWorkspacesPage() {
  const { accessToken } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);

  const fetchWorkspaces = () => {
    if (!accessToken) return;
    setIsLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("search", search);

    apiClient
      .get<{ data: { workspaces: AdminWorkspace[]; total: number; totalPages: number } }>(
        `/admin/workspaces?${params}`,
        { token: accessToken },
      )
      .then((res) => {
        setWorkspaces(res.data.workspaces);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchWorkspaces(); }, [accessToken, page, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete workspace "${name}"? This cannot be undone.`)) return;
    if (!accessToken) return;
    try {
      await apiClient.delete(`/admin/workspaces/${id}`, { token: accessToken });
      toast.success("Workspace deleted");
      fetchWorkspaces();
      if (detail?.id === id) setDetail(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete");
    }
  };

  const handleViewDetail = async (id: string) => {
    if (!accessToken) return;
    try {
      const res = await apiClient.get<{ data: any }>(`/admin/workspaces/${id}`, { token: accessToken });
      setDetail(res.data);
    } catch { }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="mt-1 text-muted-foreground">{total} total workspaces</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search workspaces..."
            className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Workspace list */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : workspaces.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No workspaces found</div>
          ) : (
            workspaces.map((ws) => (
              <div key={ws.id} className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{ws.name}</h3>
                    <p className="text-xs text-muted-foreground">/{ws.slug}</p>
                    {ws.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{ws.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewDetail(ws.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ws.id, ws.name)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete workspace"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span>{ws._count.members} members</span>
                  <span>{ws._count.channels} channels</span>
                  <span>Created {new Date(ws.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="inline-flex h-8 items-center rounded-md border px-3 text-xs disabled:opacity-50">Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="inline-flex h-8 items-center rounded-md border px-3 text-xs disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {detail && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">{detail.name}</h2>
            <p className="text-sm text-muted-foreground">/{detail.slug}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="text-xl font-bold">{detail._count?.members || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Channels</p>
                <p className="text-xl font-bold">{detail._count?.channels || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Files</p>
                <p className="text-xl font-bold">{detail._count?.files || 0}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Conversations</p>
                <p className="text-xl font-bold">{detail._count?.conversations || 0}</p>
              </div>
            </div>

            {detail.members && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">Recent Members</h3>
                <div className="mt-2 space-y-2">
                  {detail.members.slice(0, 10).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                      <div>
                        <span className="font-medium">{m.user?.displayName || m.user?.name || m.user?.email}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{m.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
