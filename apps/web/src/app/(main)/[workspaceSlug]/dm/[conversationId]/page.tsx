"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ClientEvent, ServerEvent, type Message, type Conversation } from "@chat/shared";

import { useSocketContext } from "@/components/providers/socket-provider";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export default function DmConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const workspaceSlug = params.workspaceSlug as string;

  const { accessToken, user } = useAuthStore();
  const { socket, isConnected } = useSocketContext();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    setIsLoading(true);
    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (!ws) return;
        setWorkspaceId(ws.id);

        return Promise.all([
          apiClient.get<{ data: Conversation }>(
            `/workspaces/${ws.id}/conversations/${conversationId}`,
            { token: accessToken },
          ),
          apiClient.get<{ messages: Message[] }>(
            `/workspaces/${ws.id}/conversations/${conversationId}/messages`,
            { token: accessToken },
          ),
        ]).then(([convRes, msgRes]) => {
          setConversation(convRes.data);
          setMessages(msgRes.messages.reverse());

          if (socket && isConnected) {
            socket.emit(ClientEvent.CONVERSATION_JOIN, conversationId);
          }

          setTimeout(scrollToBottom, 100);
        });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    return () => {
      if (socket) {
        socket.emit(ClientEvent.CONVERSATION_LEAVE, conversationId);
      }
    };
  }, [accessToken, workspaceSlug, conversationId, socket, isConnected]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
    };

    socket.on(ServerEvent.MESSAGE_NEW, handleNewMessage);
    return () => {
      socket.off(ServerEvent.MESSAGE_NEW, handleNewMessage);
    };
  }, [socket, conversationId, scrollToBottom]);

  const handleSend = () => {
    if (!newMessage.trim() || !socket || !workspaceId) return;

    const content = newMessage.trim();
    setNewMessage("");

    apiClient
      .post(
        `/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
        { content },
        { token: accessToken! },
      )
      .catch(() => {});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const conversationName = conversation
    ? conversation.name ||
      conversation.participants
        ?.filter((p: any) => p.id !== user?.id)
        .map((p: any) => p.displayName || p.name)
        .join(", ") ||
      "Conversation"
    : "Loading...";

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <Link href={`/${workspaceSlug}/dm`} className="rounded-md p-1 hover:bg-accent lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
          {conversationName.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-lg font-semibold">{conversationName}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showHeader =
              !prevMessage ||
              prevMessage.authorId !== message.authorId ||
              new Date(message.createdAt).getTime() -
                new Date(prevMessage.createdAt).getTime() >
                300000;

            return (
              <div
                key={message.id}
                className={cn(
                  "group relative flex gap-3 rounded px-2 py-0.5 hover:bg-muted/50",
                  showHeader && "mt-4 pt-2",
                )}
              >
                {showHeader ? (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {(message.author?.displayName || message.author?.name || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                ) : (
                  <div className="w-9 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {showHeader && (
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold">
                        {message.author?.displayName || message.author?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-end gap-2 rounded-lg border bg-background p-2">
          <textarea
            placeholder={`Message ${conversationName}`}
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
