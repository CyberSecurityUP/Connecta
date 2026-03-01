"use client";

import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Plus,
  RefreshCw,
  Trash2,
  Webhook,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

const WEBHOOK_EVENTS = [
  "MESSAGE_CREATED",
  "MESSAGE_UPDATED",
  "MESSAGE_DELETED",
  "MEMBER_JOINED",
  "MEMBER_LEFT",
  "CHANNEL_CREATED",
  "CHANNEL_ARCHIVED",
  "REACTION_ADDED",
  "FILE_UPLOADED",
] as const;

type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

interface WebhookData {
  id: string;
  name: string;
  url: string;
  description?: string;
  secret?: string;
  events: WebhookEvent[];
  active: boolean;
  lastTriggeredAt?: string;
  failureCount?: number;
  createdAt: string;
}

interface LogEntry {
  id: string;
  event: string;
  status: "success" | "failure";
  durationMs: number;
  responseCode: number;
  errorMessage?: string;
  createdAt: string;
}

type ViewMode = "list" | "create" | "edit" | "logs";

export default function WebhooksSettingsPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { accessToken } = useAuthStore();

  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingWebhook, setEditingWebhook] = useState<WebhookData | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsWebhookName, setLogsWebhookName] = useState("");
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEvents, setFormEvents] = useState<WebhookEvent[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Secret display state
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (ws) {
          setWorkspaceId(ws.id);
          return apiClient
            .get<{ data: WebhookData[] }>(`/workspaces/${ws.id}/webhooks`, { token: accessToken })
            .then((wRes) => setWebhooks(wRes.data));
        }
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, workspaceSlug]);

  const resetForm = () => {
    setFormName("");
    setFormUrl("");
    setFormDescription("");
    setFormEvents([]);
    setNewSecret(null);
    setSecretCopied(false);
  };

  const openCreateForm = () => {
    resetForm();
    setEditingWebhook(null);
    setViewMode("create");
  };

  const openEditForm = (webhook: WebhookData) => {
    setFormName(webhook.name);
    setFormUrl(webhook.url);
    setFormDescription(webhook.description || "");
    setFormEvents([...webhook.events]);
    setEditingWebhook(webhook);
    setNewSecret(null);
    setSecretCopied(false);
    setViewMode("edit");
  };

  const cancelForm = () => {
    resetForm();
    setEditingWebhook(null);
    setViewMode("list");
  };

  const toggleEvent = (event: WebhookEvent) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleCreate = async () => {
    if (!workspaceId || !accessToken || !formName.trim() || !formUrl.trim()) return;
    if (formEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiClient.post<{ data: WebhookData }>(
        `/workspaces/${workspaceId}/webhooks`,
        {
          name: formName.trim(),
          url: formUrl.trim(),
          description: formDescription.trim() || undefined,
          events: formEvents,
        },
        { token: accessToken },
      );
      setWebhooks((prev) => [...prev, res.data]);
      if (res.data.secret) {
        setNewSecret(res.data.secret);
      }
      toast.success("Webhook created");
      setViewMode("list");
      resetForm();
      if (res.data.secret) {
        setNewSecret(res.data.secret);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to create webhook");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!workspaceId || !accessToken || !editingWebhook || !formName.trim() || !formUrl.trim())
      return;
    if (formEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiClient.patch<{ data: WebhookData }>(
        `/workspaces/${workspaceId}/webhooks/${editingWebhook.id}`,
        {
          name: formName.trim(),
          url: formUrl.trim(),
          description: formDescription.trim() || undefined,
          events: formEvents,
        },
        { token: accessToken },
      );
      setWebhooks((prev) => prev.map((w) => (w.id === editingWebhook.id ? res.data : w)));
      toast.success("Webhook updated");
      cancelForm();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update webhook");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!workspaceId || !accessToken) return;
    if (!confirm("Are you sure you want to delete this webhook? This action cannot be undone."))
      return;

    try {
      await apiClient.delete(`/workspaces/${workspaceId}/webhooks/${webhookId}`, {
        token: accessToken,
      });
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
      toast.success("Webhook deleted");
    } catch {
      toast.error("Failed to delete webhook");
    }
  };

  const handleToggleActive = async (webhook: WebhookData) => {
    if (!workspaceId || !accessToken) return;

    try {
      const res = await apiClient.patch<{ data: WebhookData }>(
        `/workspaces/${workspaceId}/webhooks/${webhook.id}`,
        { active: !webhook.active },
        { token: accessToken },
      );
      setWebhooks((prev) => prev.map((w) => (w.id === webhook.id ? res.data : w)));
      toast.success(res.data.active ? "Webhook activated" : "Webhook deactivated");
    } catch {
      toast.error("Failed to update webhook");
    }
  };

  const handleRegenerateSecret = async (webhookId: string) => {
    if (!workspaceId || !accessToken) return;
    if (!confirm("Regenerate the signing secret? The old secret will stop working immediately."))
      return;

    setRegeneratingId(webhookId);
    try {
      const res = await apiClient.post<{ data: { secret: string } }>(
        `/workspaces/${workspaceId}/webhooks/${webhookId}/regenerate-secret`,
        undefined,
        { token: accessToken },
      );
      setNewSecret(res.data.secret);
      setSecretCopied(false);
      toast.success("Secret regenerated");
    } catch {
      toast.error("Failed to regenerate secret");
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleViewLogs = async (webhook: WebhookData) => {
    if (!workspaceId || !accessToken) return;

    setIsLogsLoading(true);
    setLogsWebhookName(webhook.name);
    setViewMode("logs");
    try {
      const res = await apiClient.get<{ data: LogEntry[] }>(
        `/workspaces/${workspaceId}/webhooks/${webhook.id}/logs`,
        { token: accessToken },
      );
      setLogs(res.data);
    } catch {
      toast.error("Failed to load delivery logs");
      setLogs([]);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSecretCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const formatEventLabel = (event: string) => {
    return event
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // -- Secret banner (shown after create or regenerate) --
  const secretBanner = newSecret && (
    <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Save this secret - it won&apos;t be shown again
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-yellow-100 px-3 py-1.5 font-mono text-sm text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">
              {newSecret}
            </code>
            <button
              onClick={() => copyToClipboard(newSecret)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-yellow-400 px-3 text-xs font-medium text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900"
            >
              {secretCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={() => setNewSecret(null)}
          className="rounded-md p-1 text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // -- Logs view --
  if (viewMode === "logs") {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setViewMode("list");
              setLogs([]);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-accent"
          >
            <X className="h-4 w-4" />
            Back to webhooks
          </button>
          <h1 className="text-2xl font-bold">Delivery Logs</h1>
        </div>
        <p className="mt-1 text-muted-foreground">
          Delivery history for <span className="font-medium text-foreground">{logsWebhookName}</span>
        </p>

        {isLogsLoading ? (
          <div className="mt-8 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border py-12 text-center">
            <Globe className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">No delivery logs yet</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">Event</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Duration</th>
                  <th className="px-4 py-3 text-left font-medium">Response Code</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {log.event}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === "success" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                          <Check className="h-3 w-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                          <X className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.durationMs}ms</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          log.responseCode >= 200 && log.responseCode < 300
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {log.responseCode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.some((l) => l.status === "failure" && l.errorMessage) && (
              <div className="border-t bg-muted/30 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">Recent errors:</p>
                {logs
                  .filter((l) => l.status === "failure" && l.errorMessage)
                  .slice(0, 3)
                  .map((l) => (
                    <p key={l.id} className="mt-1 text-xs text-red-600 dark:text-red-400">
                      [{new Date(l.createdAt).toLocaleTimeString()}] {l.errorMessage}
                    </p>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -- Create/Edit form --
  const webhookForm = (viewMode === "create" || viewMode === "edit") && (
    <div className="mb-6 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">
        {viewMode === "create" ? "Create Webhook" : "Edit Webhook"}
      </h3>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="My Webhook"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            URL <span className="text-destructive">*</span>
          </label>
          <input
            type="url"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://example.com/webhook"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Optional description for this webhook"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Events <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">Select which events will trigger this webhook</p>
          <div className="grid grid-cols-3 gap-2">
            {WEBHOOK_EVENTS.map((event) => (
              <label
                key={event}
                className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={formEvents.includes(event)}
                  onChange={() => toggleEvent(event)}
                />
                <span className="truncate">{formatEventLabel(event)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={cancelForm}
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={viewMode === "create" ? handleCreate : handleUpdate}
            disabled={isSaving || !formName.trim() || !formUrl.trim() || formEvents.length === 0}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : viewMode === "create"
                ? "Create Webhook"
                : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  // -- List view --
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="mt-1 text-muted-foreground">
            Manage webhook integrations for this workspace
          </p>
        </div>
        {viewMode === "list" && (
          <button
            onClick={openCreateForm}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Webhook
          </button>
        )}
      </div>

      <div className="mt-6">
        {secretBanner}
        {webhookForm}

        {viewMode === "list" && (
          <>
            {webhooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border py-12 text-center">
                <Webhook className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 font-medium">No webhooks configured</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a webhook to receive real-time event notifications
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{webhook.name}</h3>
                          <span
                            className={
                              webhook.active
                                ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }
                          >
                            {webhook.active ? "Active" : "Inactive"}
                          </span>
                          {(webhook.failureCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                              <AlertTriangle className="h-3 w-3" />
                              {webhook.failureCount} failures
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{webhook.url}</span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <span
                              key={event}
                              className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                            >
                              {event}
                            </span>
                          ))}
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          {webhook.lastTriggeredAt && (
                            <span>Last triggered {formatTimeAgo(webhook.lastTriggeredAt)}</span>
                          )}
                          <span>Created {formatTimeAgo(webhook.createdAt)}</span>
                        </div>

                        {/* Masked secret */}
                        <div className="mt-2 flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                            {showSecrets[webhook.id]
                              ? webhook.secret || "whsec_************************"
                              : "whsec_************************"}
                          </code>
                          <button
                            onClick={() =>
                              setShowSecrets((prev) => ({
                                ...prev,
                                [webhook.id]: !prev[webhook.id],
                              }))
                            }
                            className="rounded p-1 text-muted-foreground hover:bg-accent"
                            title={showSecrets[webhook.id] ? "Hide secret" : "Show secret"}
                          >
                            {showSecrets[webhook.id] ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRegenerateSecret(webhook.id)}
                            disabled={regeneratingId === webhook.id}
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                            title="Regenerate secret"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${regeneratingId === webhook.id ? "animate-spin" : ""}`}
                            />
                            Regenerate
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => handleViewLogs(webhook)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="View logs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Logs
                        </button>
                        <button
                          onClick={() => openEditForm(webhook)}
                          className="inline-flex h-8 items-center rounded-md border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="Edit webhook"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(webhook)}
                          className={`inline-flex h-8 items-center rounded-md border px-2.5 text-xs hover:bg-accent ${
                            webhook.active
                              ? "text-muted-foreground hover:text-foreground"
                              : "text-green-600 hover:text-green-700 dark:text-green-400"
                          }`}
                          title={webhook.active ? "Deactivate" : "Activate"}
                        >
                          {webhook.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDelete(webhook.id)}
                          className="inline-flex h-8 items-center justify-center rounded-md border border-destructive px-2.5 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          title="Delete webhook"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
