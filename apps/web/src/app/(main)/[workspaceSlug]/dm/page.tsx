"use client";

import { MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Conversation } from "@chat/shared";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function DmListPage() {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { accessToken, user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (ws) {
          setWorkspaceId(ws.id);
          return apiClient
            .get<{ data: Conversation[] }>(`/workspaces/${ws.id}/conversations`, {
              token: accessToken,
            })
            .then((convRes) => setConversations(convRes.data));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [accessToken, workspaceSlug]);

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    const others = conv.participants?.filter((p: any) => p.id !== user?.id) || [];
    return others.map((p: any) => p.displayName || p.name || p.email).join(", ") || "Conversation";
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <h1 className="text-lg font-semibold">Direct Messages</h1>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          New Message
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-semibold">No conversations yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a direct message with a team member
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/${workspaceSlug}/dm/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                  {getConversationName(conv).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{getConversationName(conv)}</span>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="truncate text-sm text-muted-foreground">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
