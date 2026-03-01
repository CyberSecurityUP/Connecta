"use client";

import { ArrowLeft, Settings, Trash2, UserMinus, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

interface ChannelMember {
  userId: string;
  user: {
    id: string;
    name?: string;
    displayName?: string;
    email: string;
  };
}

export default function ChannelSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const channelSlug = params.channelSlug as string;
  const workspaceSlug = params.workspaceSlug as string;

  const { accessToken, user } = useAuthStore();

  const [channel, setChannel] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [form, setForm] = useState({ name: "", topic: "", description: "" });

  // Load workspace, channel, and members
  useEffect(() => {
    if (!accessToken || !workspaceSlug) return;

    setIsLoading(true);

    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (!ws) return;

        setWorkspaceId(ws.id);

        return apiClient
          .get<{ data: any[] }>(`/workspaces/${ws.id}/channels`, {
            token: accessToken,
          })
          .then((chRes) => {
            const ch = chRes.data.find((c: any) => c.slug === channelSlug);
            if (!ch) return;

            setChannel(ch);
            setForm({
              name: ch.name || "",
              topic: ch.topic || "",
              description: ch.description || "",
            });

            // Fetch channel members
            return apiClient
              .get<{ data: ChannelMember[] }>(
                `/workspaces/${ws.id}/channels/${ch.id}/members`,
                { token: accessToken },
              )
              .then((mRes) => {
                setMembers(mRes.data);
              });
          });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [accessToken, workspaceSlug, channelSlug]);

  const handleSave = async () => {
    if (!channel || !workspaceId || !accessToken) return;

    setIsSaving(true);
    try {
      const updated = await apiClient.patch<any>(
        `/workspaces/${workspaceId}/channels/${channel.id}`,
        form,
        { token: accessToken },
      );
      setChannel({ ...channel, ...updated });
      toast.success("Channel settings saved");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to save settings",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!channel || !workspaceId || !accessToken) return;
    if (!confirm("Are you sure you want to remove this member from the channel?")) return;

    try {
      await apiClient.delete(
        `/workspaces/${workspaceId}/channels/${channel.id}/members/${userId}`,
        { token: accessToken },
      );
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success("Member removed from channel");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to remove member",
      );
    }
  };

  const handleLeaveChannel = async () => {
    if (!channel || !workspaceId || !accessToken) return;
    if (!confirm("Are you sure you want to leave this channel?")) return;

    setIsLeaving(true);
    try {
      await apiClient.post(
        `/workspaces/${workspaceId}/channels/${channel.id}/leave`,
        undefined,
        { token: accessToken },
      );
      toast.success("You have left the channel");
      router.push(`/${workspaceSlug}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to leave channel",
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const handleArchiveChannel = async () => {
    if (!channel || !workspaceId || !accessToken) return;
    if (!confirm("Are you sure you want to archive this channel? This action cannot be easily undone.")) return;

    setIsArchiving(true);
    try {
      await apiClient.patch(
        `/workspaces/${workspaceId}/channels/${channel.id}`,
        { isArchived: true },
        { token: accessToken },
      );
      toast.success("Channel archived");
      router.push(`/${workspaceSlug}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to archive channel",
      );
    } finally {
      setIsArchiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Channel not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${workspaceSlug}/channel/${channelSlug}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Channel Settings</h1>
        </div>
      </div>
      <p className="mt-1 pl-12 text-muted-foreground">
        Manage settings for #{channel.name}
      </p>

      {/* Channel Overview */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Channel Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the channel name, topic, and description.
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Channel Name</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. general"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Topic</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="What is this channel about?"
            />
            <p className="text-xs text-muted-foreground">
              The topic is displayed at the top of the channel.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the purpose of this channel"
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
      </div>

      {/* Members Section */}
      <div className="mt-12">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Members</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {members.length}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          People who are part of this channel.
        </p>

        <div className="mt-4 divide-y rounded-lg border">
          {members.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No members found.
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-4 px-4 py-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {(
                    member.user.displayName ||
                    member.user.name ||
                    "?"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {member.user.displayName || member.user.name || "Unknown"}
                    {member.userId === user?.id && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>

                {member.userId !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-destructive"
                    title="Remove member"
                  >
                    <UserMinus className="h-4 w-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 rounded-lg border border-destructive/50 p-6">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">
            Danger Zone
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          These actions are irreversible. Please proceed with caution.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-md border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Leave Channel</p>
              <p className="text-sm text-muted-foreground">
                You will no longer receive messages from this channel.
              </p>
            </div>
            <button
              onClick={handleLeaveChannel}
              disabled={isLeaving}
              className="inline-flex h-10 items-center justify-center rounded-md border border-destructive px-6 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
            >
              {isLeaving ? "Leaving..." : "Leave channel"}
            </button>
          </div>

          <div className="flex items-center justify-between rounded-md border border-destructive/30 p-4">
            <div>
              <p className="font-medium">Archive Channel</p>
              <p className="text-sm text-muted-foreground">
                Archiving will prevent anyone from posting new messages.
              </p>
            </div>
            <button
              onClick={handleArchiveChannel}
              disabled={isArchiving}
              className="inline-flex h-10 items-center justify-center rounded-md border border-destructive px-6 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
            >
              {isArchiving ? "Archiving..." : "Archive channel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
