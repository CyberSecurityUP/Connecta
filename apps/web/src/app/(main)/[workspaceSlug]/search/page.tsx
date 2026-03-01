"use client";

import { FileText, Hash, Search, User, X } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type SearchTab = "messages" | "channels" | "members" | "files";

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = params.workspaceSlug as string;
  const initialQuery = searchParams.get("q") || "";

  const { accessToken } = useAuthStore();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>("messages");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: any[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = res.data.find((w: any) => w.slug === workspaceSlug);
        if (ws) setWorkspaceId(ws.id);
      });
  }, [accessToken, workspaceSlug]);

  useEffect(() => {
    if (!workspaceId || !query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const endpoint = `/workspaces/${workspaceId}/search/${activeTab}?q=${encodeURIComponent(query)}`;
        const res = await apiClient.get<{ data: any[] }>(endpoint, { token: accessToken! });
        setResults(res.data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeTab, workspaceId, accessToken]);

  const tabs: { id: SearchTab; label: string; icon: React.ReactNode }[] = [
    { id: "messages", label: "Messages", icon: <FileText className="h-4 w-4" /> },
    { id: "channels", label: "Channels", icon: <Hash className="h-4 w-4" /> },
    { id: "members", label: "People", icon: <User className="h-4 w-4" /> },
    { id: "files", label: "Files", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages, channels, people, files..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !query.trim() ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-semibold">Search your workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Find messages, channels, people, and files
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No results found for &quot;{query}&quot;</p>
          </div>
        ) : (
          <div className="divide-y">
            {activeTab === "messages" &&
              results.map((result: any) => (
                <Link
                  key={result.id}
                  href={`/${workspaceSlug}/channel/${result.channelSlug || "general"}`}
                  className="block px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {result.author?.displayName || result.author?.name}
                    </span>
                    {result.channelName && (
                      <span className="text-muted-foreground">in #{result.channelName}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{result.highlight || result.content}</p>
                </Link>
              ))}

            {activeTab === "channels" &&
              results.map((channel: any) => (
                <Link
                  key={channel.id}
                  href={`/${workspaceSlug}/channel/${channel.slug}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{channel.name}</span>
                    {channel.topic && (
                      <p className="text-sm text-muted-foreground">{channel.topic}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {channel._count?.members || 0} members
                  </span>
                </Link>
              ))}

            {activeTab === "members" &&
              results.map((member: any) => (
                <div key={member.user.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {(member.user.displayName || member.user.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">
                      {member.user.displayName || member.user.name}
                    </span>
                    <p className="text-sm text-muted-foreground">{member.user.title || member.user.email}</p>
                  </div>
                </div>
              ))}

            {activeTab === "files" &&
              results.map((file: any) => (
                <div key={file.id} className="flex items-center gap-3 px-4 py-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-medium">{file.name}</span>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB &middot; Uploaded by{" "}
                      {file.uploadedBy?.displayName || file.uploadedBy?.name}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
