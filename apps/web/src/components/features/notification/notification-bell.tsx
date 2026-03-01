"use client";

import { Bell, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ServerEvent, type Notification } from "@chat/shared";

import { useSocketContext } from "@/components/providers/socket-provider";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function NotificationBell() {
  const { accessToken } = useAuthStore();
  const { socket } = useSocketContext();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: { count: number } }>("/notifications/unread-count", { token: accessToken })
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => {});
  }, [accessToken]);

  // Listen for new notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on(ServerEvent.NOTIFICATION_NEW, handleNewNotification);
    return () => {
      socket.off(ServerEvent.NOTIFICATION_NEW, handleNewNotification);
    };
  }, [socket]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!isOpen || !accessToken) return;
    apiClient
      .get<{ data: Notification[] }>("/notifications?limit=20", { token: accessToken })
      .then((res) => setNotifications(res.data))
      .catch(() => {});
  }, [isOpen, accessToken]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    if (!accessToken) return;
    await apiClient.post("/notifications/read-all", undefined, { token: accessToken });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md p-2 hover:bg-accent"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "border-b px-4 py-3 last:border-b-0",
                    !notification.isRead && "bg-primary/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
                    </div>
                    {!notification.isRead && (
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
