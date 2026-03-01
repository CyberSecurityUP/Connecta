"use client";

import { Mail, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function InvitationsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { accessToken } = useAuthStore();

  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (ws) {
          setWorkspaceId(ws.id);
          return apiClient
            .get<{ data: any[] }>(`/workspaces/${ws.id}/invitations`, { token: accessToken })
            .then((iRes) => setInvitations(iRes.data));
        }
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, workspaceSlug]);

  const handleSendInvitations = async () => {
    if (!workspaceId || !accessToken || !emails.trim()) return;

    const emailList = emails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e);

    setIsSending(true);
    try {
      await apiClient.post(
        `/workspaces/${workspaceId}/invitations`,
        { emails: emailList, role },
        { token: accessToken },
      );
      toast.success(`Invited ${emailList.length} member(s)`);
      setEmails("");
      setShowForm(false);

      // Refresh list
      const iRes = await apiClient.get<{ data: any[] }>(
        `/workspaces/${workspaceId}/invitations`,
        { token: accessToken },
      );
      setInvitations(iRes.data);
    } catch {
      toast.error("Failed to send invitations");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitations</h1>
          <p className="mt-1 text-muted-foreground">Invite people to join your workspace</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Invite
        </button>
      </div>

      {showForm && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email addresses</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter email addresses, separated by commas or new lines"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvitations}
                disabled={isSending || !emails.trim()}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send invitations"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border py-12 text-center">
            <Mail className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">No pending invitations</p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{inv.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Invited as {inv.role} &middot; Expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await apiClient.delete(`/workspaces/${workspaceId}/invitations/${inv.id}`, {
                      token: accessToken!,
                    });
                    setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
                    toast.success("Invitation revoked");
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
