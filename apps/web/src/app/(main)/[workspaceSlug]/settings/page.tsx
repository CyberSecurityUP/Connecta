"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { accessToken } = useAuthStore();

  const [workspace, setWorkspace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (ws) {
          setWorkspace(ws);
          setForm({ name: ws.name, description: ws.description || "" });
        }
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, workspaceSlug]);

  const handleSave = async () => {
    if (!workspace || !accessToken) return;
    setIsSaving(true);
    try {
      await apiClient.patch(`/workspaces/${workspace.id}`, form, { token: accessToken });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">General Settings</h1>
      <p className="mt-1 text-muted-foreground">Manage your workspace settings</p>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Workspace Name</label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this workspace for?"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="mt-12 rounded-lg border border-destructive/50 p-6">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Once you delete a workspace, there is no going back.
        </p>
        <button className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-destructive px-4 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground">
          Delete workspace
        </button>
      </div>
    </div>
  );
}
