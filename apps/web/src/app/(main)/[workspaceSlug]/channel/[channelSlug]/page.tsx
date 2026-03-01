"use client";

import { Hash, Search, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ClientEvent, ServerEvent, type Message } from "@chat/shared";

import { FileUploadButton } from "@/components/features/file-upload/file-upload-button";
import { NotificationBell } from "@/components/features/notification/notification-bell";
import { useSocketContext } from "@/components/providers/socket-provider";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useTypingStore } from "@/stores/typing-store";
import { useUIStore } from "@/stores/ui-store";

export default function ChannelPage() {
  const params = useParams();
  const channelSlug = params.channelSlug as string;
  const workspaceSlug = params.workspaceSlug as string;

  const { accessToken, user } = useAuthStore();
  const { socket, isConnected } = useSocketContext();
  const typingUsers = useTypingStore((s) => s.getTypingUsers);
  const { openThread, toggleCommandPalette } = useUIStore();

  const [workspace, setWorkspace] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load channel and messages
  useEffect(() => {
    if (!accessToken || !workspaceSlug) return;

    setIsLoading(true);

    // First get workspace to get its ID
    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (!ws) return;
        setWorkspace(ws);

        // Get all channels to find the one matching the slug
        return apiClient
          .get<{ data: any[] }>(`/workspaces/${ws.id}/channels`, { token: accessToken })
          .then((chRes) => {
            const ch = chRes.data.find((c: any) => c.slug === channelSlug);
            if (!ch) return;
            setChannel(ch);

            // Join socket room
            if (socket && isConnected) {
              socket.emit(ClientEvent.CHANNEL_JOIN, ch.id);
            }

            // Fetch messages
            return apiClient
              .get<{ messages: Message[] }>(`/workspaces/${ws.id}/channels/${ch.id}/messages`, {
                token: accessToken,
              })
              .then((msgRes) => {
                setMessages(msgRes.messages.reverse());
                setTimeout(scrollToBottom, 100);
              });
          });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));

    return () => {
      if (socket && channel) {
        socket.emit(ClientEvent.CHANNEL_LEAVE, channel.id);
      }
    };
  }, [accessToken, workspaceSlug, channelSlug, socket, isConnected]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !channel) return;

    const handleNewMessage = (message: Message) => {
      if (message.channelId === channel.id && !message.parentId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleMessageUpdated = (message: any) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m)),
      );
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socket.on(ServerEvent.MESSAGE_NEW, handleNewMessage);
    socket.on(ServerEvent.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(ServerEvent.MESSAGE_DELETED, handleMessageDeleted);

    return () => {
      socket.off(ServerEvent.MESSAGE_NEW, handleNewMessage);
      socket.off(ServerEvent.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(ServerEvent.MESSAGE_DELETED, handleMessageDeleted);
    };
  }, [socket, channel, scrollToBottom]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !socket || !channel) return;

    const content = newMessage.trim();
    setNewMessage("");

    // Send via socket for real-time
    socket.emit(ClientEvent.MESSAGE_SEND, {
      channelId: channel.id,
      content,
    });

    // Stop typing indicator
    socket.emit(ClientEvent.TYPING_STOP, { channelId: channel.id });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Typing indicator
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (!socket || !channel) return;

    socket.emit(ClientEvent.TYPING_START, { channelId: channel.id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(ClientEvent.TYPING_STOP, { channelId: channel.id });
    }, 3000);
  };

  const currentTypingUsers = channel ? typingUsers(channel.id) : [];

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
    <div className="flex flex-1 flex-col">
      {/* Channel header */}
      <header className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{channel.name}</h1>
          {channel.topic && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="truncate text-sm text-muted-foreground">{channel.topic}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent">
            <Users className="h-4 w-4" />
            <span>{channel.memberCount}</span>
          </button>
          <button
            onClick={toggleCommandPalette}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            title="Search (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
          </button>
          <NotificationBell />
          <Link
            href={`/${workspaceSlug}/channel/${channelSlug}/settings`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            title="Channel settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Hash className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Welcome to #{channel.name}</h2>
            <p className="mt-1 text-muted-foreground">
              This is the start of the #{channel.name} channel.
              {channel.topic && ` ${channel.topic}`}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const showHeader =
                !prevMessage ||
                prevMessage.authorId !== message.authorId ||
                new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() >
                  300000; // 5 min gap

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
                  {/* Hover action bar */}
                  <div className="absolute -top-3 right-2 hidden rounded-md border bg-background shadow-sm group-hover:flex">
                    <button
                      onClick={() => openThread(message.id, channel.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Reply in thread"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </button>
                  </div>

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
                    <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>

                    {/* Reactions */}
                    {message.reactions?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {message.reactions.map((reaction) => (
                          <button
                            key={reaction.emoji}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
                              reaction.userIds?.includes(user?.id || "") && "border-primary bg-primary/10",
                            )}
                          >
                            <span>{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Thread preview */}
                    {message.replyCount > 0 && (
                      <button
                        onClick={() => openThread(message.id, channel.id)}
                        className="mt-1 text-xs font-medium text-primary hover:underline"
                      >
                        {message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {currentTypingUsers.length > 0 && (
        <div className="px-4 py-1 text-xs text-muted-foreground">
          Someone is typing...
        </div>
      )}

      {/* Message input */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2 rounded-lg border bg-background p-2">
          {workspace && (
            <FileUploadButton
              workspaceId={workspace.id}
              onFileUploaded={(file) => {
                // Send a message with the file link
                if (socket && channel) {
                  socket.emit(ClientEvent.MESSAGE_SEND, {
                    channelId: channel.id,
                    content: `📎 [${file.name}](${file.url})`,
                  });
                }
              }}
            />
          )}
          <textarea
            placeholder={`Message #${channel.name}`}
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
  );
}
