"use client";

import { Hash, Lock, MessageSquare, Plus, Search, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface WorkspaceSidebarProps {
  workspace: any;
  channels: any[];
  workspaceSlug: string;
}

export function WorkspaceSidebar({ workspace, channels, workspaceSlug }: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const { openModal, toggleCommandPalette } = useUIStore();

  const publicChannels = channels.filter((ch) => ch.type === "PUBLIC");
  const privateChannels = channels.filter((ch) => ch.type === "PRIVATE");

  return (
    <aside className="flex w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
      {/* Workspace header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <h2 className="truncate text-lg font-bold">{workspace.name}</h2>
        <button
          onClick={toggleCommandPalette}
          className="rounded-md p-1.5 hover:bg-sidebar-accent"
          title="Search (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {/* Channels section */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold uppercase text-sidebar-foreground/60">
              Channels
            </span>
            <button
              onClick={() => openModal("create-channel")}
              className="rounded p-0.5 hover:bg-sidebar-accent"
              title="Create channel"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <nav className="space-y-0.5">
            {publicChannels.map((channel) => (
              <Link
                key={channel.id}
                href={`/${workspaceSlug}/channel/${channel.slug}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
                  pathname.includes(`/channel/${channel.slug}`) &&
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                )}
              >
                <Hash className="h-4 w-4 shrink-0 opacity-60" />
                <span className="truncate">{channel.name}</span>
              </Link>
            ))}

            {privateChannels.map((channel) => (
              <Link
                key={channel.id}
                href={`/${workspaceSlug}/channel/${channel.slug}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
                  pathname.includes(`/channel/${channel.slug}`) &&
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                )}
              >
                <Lock className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{channel.name}</span>
              </Link>
            ))}

            <button
              onClick={() => openModal("browse-channels")}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Browse channels</span>
            </button>
          </nav>
        </div>

        {/* Direct Messages section */}
        <div>
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-semibold uppercase text-sidebar-foreground/60">
              Direct Messages
            </span>
            <button
              onClick={() => openModal("create-dm")}
              className="rounded p-0.5 hover:bg-sidebar-accent"
              title="New message"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <nav className="space-y-0.5">
            <Link
              href={`/${workspaceSlug}/dm`}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
                pathname.endsWith("/dm") && "bg-sidebar-accent font-medium",
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
              <span>All messages</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="space-y-0.5 border-t border-sidebar-border p-2">
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <UserIcon className="h-4 w-4" />
          <span>Account</span>
        </Link>
        <Link
          href={`/${workspaceSlug}/settings`}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
