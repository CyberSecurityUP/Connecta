"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ClientEvent } from "@chat/shared";

import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { NotificationBell } from "@/components/features/notification/notification-bell";
import { CommandPalette } from "@/components/features/search/command-palette";
import { ThreadPanel } from "@/components/features/thread/thread-panel";
import { useSocketContext } from "@/components/providers/socket-provider";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;
  const { accessToken } = useAuthStore();
  const { socket, isConnected } = useSocketContext();
  const { sidebarOpen, rightPanel } = useUIStore();
  const [workspace, setWorkspace] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    if (!accessToken || !workspaceSlug) return;

    // Fetch workspace details
    apiClient
      .get<{ data: any }>(`/workspaces`, { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (ws) {
          setWorkspace(ws);

          // Join workspace socket room
          if (socket && isConnected) {
            socket.emit(ClientEvent.WORKSPACE_JOIN, ws.id);
          }

          // Fetch channels
          apiClient
            .get<{ data: any[] }>(`/workspaces/${ws.id}/channels?filter=joined`, {
              token: accessToken,
            })
            .then((chRes) => setChannels(chRes.data))
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [accessToken, workspaceSlug, socket, isConnected]);

  if (!workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Connection status banner */}
      {!isConnected && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-yellow-500 py-1 text-center text-sm font-medium text-white">
          Reconnecting...
        </div>
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <WorkspaceSidebar
          workspace={workspace}
          channels={channels}
          workspaceSlug={workspaceSlug}
        />
      )}

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>

      {/* Thread panel */}
      {rightPanel?.type === "thread" && workspace && (
        <ThreadPanel workspaceId={workspace.id} channelId={rightPanel.channelId} />
      )}

      {/* Command palette */}
      <CommandPalette workspaceId={workspace?.id} />
    </div>
  );
}
