"use client";

import { X, Hash } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ClientEvent, ServerEvent, type Message } from "@chat/shared";

import { useSocketContext } from "@/components/providers/socket-provider";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

interface ThreadPanelProps {
  workspaceId: string;
  channelId: string;
}

export function ThreadPanel({ workspaceId, channelId }: ThreadPanelProps) {
  const { accessToken, user } = useAuthStore();
  const { socket } = useSocketContext();
  const { rightPanel, closeRightPanel } = useUIStore();

  const [parentMessage, setParentMessage] = useState<Message | null>(null);
  const [replies, setReplies] = useState<Message[]>([]);
  const [newReply, setNewReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repliesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Derive messageId from the right panel state
  const messageId =
    rightPanel?.type === "thread" ? rightPanel.messageId : null;

  // Scroll to the bottom of the replies list
  const scrollToBottom = useCallback(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch parent message and thread replies
  useEffect(() => {
    if (!accessToken || !messageId || !workspaceId || !channelId) return;

    setIsLoading(true);
    setError(null);

    apiClient
      .get<{ messages: Message[] }>(
        `/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/thread`,
        { token: accessToken },
      )
      .then((res) => {
        const allMessages = res.messages;
        if (allMessages.length > 0) {
          // The first message is the parent; the rest are replies
          const parent = allMessages.find((m) => m.id === messageId);
          if (parent) {
            setParentMessage(parent);
            setReplies(allMessages.filter((m) => m.id !== messageId));
          } else {
            // Fallback: treat the first message as parent
            setParentMessage(allMessages[0]);
            setReplies(allMessages.slice(1));
          }
        } else {
          setError("Thread not found");
        }
        setTimeout(scrollToBottom, 100);
      })
      .catch(() => {
        setError("Failed to load thread");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, messageId, workspaceId, channelId, scrollToBottom]);

  // Listen for new thread replies in real time
  useEffect(() => {
    if (!socket || !messageId) return;

    const handleNewReply = (message: Message) => {
      if (message.parentId === messageId) {
        setReplies((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleMessageUpdated = (message: Message) => {
      if (message.id === messageId) {
        setParentMessage((prev) =>
          prev ? { ...prev, ...message } : prev,
        );
      } else {
        setReplies((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
        );
      }
    };

    const handleMessageDeleted = ({ messageId: deletedId }: { messageId: string }) => {
      if (deletedId === messageId) {
        // Parent was deleted, close the panel
        closeRightPanel();
      } else {
        setReplies((prev) => prev.filter((m) => m.id !== deletedId));
      }
    };

    socket.on(ServerEvent.THREAD_NEW_REPLY, handleNewReply);
    socket.on(ServerEvent.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(ServerEvent.MESSAGE_DELETED, handleMessageDeleted);

    return () => {
      socket.off(ServerEvent.THREAD_NEW_REPLY, handleNewReply);
      socket.off(ServerEvent.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(ServerEvent.MESSAGE_DELETED, handleMessageDeleted);
    };
  }, [socket, messageId, scrollToBottom, closeRightPanel]);

  // Focus the input when the panel opens
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, messageId]);

  // Send a reply
  const handleSend = () => {
    if (!newReply.trim() || !socket || !messageId) return;

    const content = newReply.trim();
    setNewReply("");

    socket.emit(ClientEvent.MESSAGE_SEND, {
      channelId,
      content,
      parentId: messageId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRightPanel();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeRightPanel]);

  if (!messageId) return null;

  return (
    <aside className="flex w-96 shrink-0 flex-col border-l bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Thread</h2>
          {parentMessage && (
            <span className="truncate text-sm text-muted-foreground">
              {parentMessage.author?.displayName || parentMessage.author?.name || "Unknown"}
            </span>
          )}
        </div>
        <button
          onClick={closeRightPanel}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close thread"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Scrollable messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Parent message */}
            {parentMessage && (
              <div className="pb-4">
                <MessageItem message={parentMessage} currentUserId={user?.id} />
                {/* Separator between parent and replies */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {replies.length} {replies.length === 1 ? "reply" : "replies"}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
            )}

            {/* Thread replies */}
            {replies.length > 0 ? (
              <div className="space-y-1">
                {replies.map((reply, index) => {
                  const prevReply = replies[index - 1];
                  const showHeader =
                    !prevReply ||
                    prevReply.authorId !== reply.authorId ||
                    new Date(reply.createdAt).getTime() -
                      new Date(prevReply.createdAt).getTime() >
                      300000; // 5 min gap

                  return (
                    <MessageItem
                      key={reply.id}
                      message={reply}
                      showHeader={showHeader}
                      currentUserId={user?.id}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No replies yet. Start the conversation!
              </p>
            )}
            <div ref={repliesEndRef} />
          </div>

          {/* Reply input */}
          <div className="border-t p-4">
            <div className="flex items-end gap-2 rounded-lg border bg-background p-2">
              <textarea
                ref={inputRef}
                placeholder="Reply..."
                className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!newReply.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label="Send reply"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-component: renders a single message using the same styling as
// the channel page message list.
// ---------------------------------------------------------------------------

interface MessageItemProps {
  message: Message;
  showHeader?: boolean;
  currentUserId?: string;
}

function MessageItem({ message, showHeader = true, currentUserId }: MessageItemProps) {
  return (
    <div
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
            {message.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
                  reaction.userIds?.includes(currentUserId || "") &&
                    "border-primary bg-primary/10",
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* File attachments */}
        {message.attachments?.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent"
              >
                <span className="truncate font-medium">{attachment.name}</span>
                <span className="shrink-0">
                  {formatFileSize(attachment.size)}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
