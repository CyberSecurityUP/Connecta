"use client";

import { ArrowRight, Hash, MessageSquare, Search, User, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

interface SearchResult {
  id: string;
  type: "channel" | "person";
  title: string;
  subtitle?: string;
  slug?: string;
  icon: "channel" | "person" | "message";
}

interface CommandPaletteProps {
  workspaceId?: string;
}

export function CommandPalette({ workspaceId: workspaceIdProp }: CommandPaletteProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceSlug = params.workspaceSlug as string;

  const { accessToken } = useAuthStore();
  const { commandPaletteOpen, toggleCommandPalette } = useUIStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState<string | undefined>(
    workspaceIdProp,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve workspace ID from slug if not provided as prop
  useEffect(() => {
    if (workspaceIdProp || !accessToken || !workspaceSlug) return;

    apiClient
      .get<{ data: any }>("/workspaces", { token: accessToken })
      .then((res) => {
        const ws = (res.data as any[]).find((w: any) => w.slug === workspaceSlug);
        if (ws) {
          setResolvedWorkspaceId(ws.id);
        }
      })
      .catch(() => {});
  }, [workspaceIdProp, accessToken, workspaceSlug]);

  // Register Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette]);

  // Focus input when palette opens; reset state when it closes
  useEffect(() => {
    if (commandPaletteOpen) {
      // Small delay to allow the DOM to render before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setIsLoading(false);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    }
  }, [commandPaletteOpen]);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || !accessToken || !resolvedWorkspaceId) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const encodedQuery = encodeURIComponent(searchQuery.trim());

        const [channelsRes, membersRes] = await Promise.allSettled([
          apiClient.get<{ data: any[] }>(
            `/workspaces/${resolvedWorkspaceId}/search/channels?q=${encodedQuery}`,
            { token: accessToken },
          ),
          apiClient.get<{ data: any[] }>(
            `/workspaces/${resolvedWorkspaceId}/search/members?q=${encodedQuery}`,
            { token: accessToken },
          ),
        ]);

        const searchResults: SearchResult[] = [];

        if (channelsRes.status === "fulfilled" && channelsRes.value.data) {
          for (const channel of channelsRes.value.data) {
            searchResults.push({
              id: channel.id,
              type: "channel",
              title: channel.name,
              subtitle: channel.description || channel.topic || undefined,
              slug: channel.slug,
              icon: "channel",
            });
          }
        }

        if (membersRes.status === "fulfilled" && membersRes.value.data) {
          for (const member of membersRes.value.data) {
            const user = member.user || member;
            searchResults.push({
              id: user.id,
              type: "person",
              title: user.displayName || user.username || user.email,
              subtitle: user.title || user.email || undefined,
              slug: undefined,
              icon: "person",
            });
          }
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, resolvedWorkspaceId],
  );

  // Handle query changes with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  // Close the palette
  const closePalette = useCallback(() => {
    if (commandPaletteOpen) {
      toggleCommandPalette();
    }
  }, [commandPaletteOpen, toggleCommandPalette]);

  // Navigate to a result
  const navigateToResult = useCallback(
    (result: SearchResult) => {
      closePalette();

      if (result.type === "channel" && result.slug) {
        router.push(`/${workspaceSlug}/channel/${result.slug}`);
      } else if (result.type === "person") {
        router.push(`/${workspaceSlug}/profile/${result.id}`);
      }
    },
    [closePalette, router, workspaceSlug],
  );

  // Navigate to full search page
  const navigateToSearch = useCallback(() => {
    if (!query.trim()) return;

    closePalette();
    router.push(`/${workspaceSlug}/search?q=${encodeURIComponent(query.trim())}`);
  }, [closePalette, query, router, workspaceSlug]);

  // Handle keyboard navigation within the palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
            navigateToResult(results[selectedIndex]);
          } else {
            navigateToSearch();
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          closePalette();
          break;
        }
      }
    },
    [results, selectedIndex, navigateToResult, navigateToSearch, closePalette],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!resultsRef.current) return;

    const selectedElement = resultsRef.current.querySelector(
      `[data-result-index="${selectedIndex}"]`,
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closePalette();
      }
    },
    [closePalette],
  );

  const renderIcon = (icon: SearchResult["icon"]) => {
    switch (icon) {
      case "channel":
        return <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />;
      case "person":
        return <User className="h-4 w-4 shrink-0 text-muted-foreground" />;
      case "message":
        return <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />;
    }
  };

  if (!commandPaletteOpen) return null;

  const recentItems: SearchResult[] = [
    {
      id: "recent-general",
      type: "channel",
      title: "general",
      subtitle: "Company-wide announcements",
      slug: "general",
      icon: "channel",
    },
    {
      id: "recent-random",
      type: "channel",
      title: "random",
      subtitle: "Non-work banter and water cooler talk",
      slug: "random",
      icon: "channel",
    },
  ];

  const displayResults = query.trim() ? results : recentItems;
  const showSectionLabel = !query.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border bg-popover shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels, people, and messages..."
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden shrink-0 rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results area */}
        <div ref={resultsRef} className="max-h-80 overflow-y-auto overscroll-contain py-2">
          {/* Loading indicator */}
          {isLoading && query.trim() && (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {/* No results */}
          {!isLoading && query.trim() && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No results found for &ldquo;{query}&rdquo;</p>
              <button
                onClick={navigateToSearch}
                className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Search all messages
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Results list */}
          {!isLoading && displayResults.length > 0 && (
            <>
              {showSectionLabel && (
                <div className="px-4 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                  Suggested
                </div>
              )}

              {query.trim() && results.some((r) => r.type === "channel") && (
                <div className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                  Channels
                </div>
              )}

              {displayResults
                .filter((r) => !query.trim() || r.type === "channel")
                .map((result, idx) => {
                  const globalIndex = displayResults.indexOf(result);
                  return (
                    <button
                      key={result.id}
                      data-result-index={globalIndex}
                      onClick={() => navigateToResult(result)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                        globalIndex === selectedIndex
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/50",
                      )}
                    >
                      {renderIcon(result.icon)}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{result.title}</div>
                        {result.subtitle && (
                          <div className="truncate text-xs text-muted-foreground">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {globalIndex === selectedIndex && (
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}

              {query.trim() && results.some((r) => r.type === "person") && (
                <div className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">
                  People
                </div>
              )}

              {query.trim() &&
                displayResults
                  .filter((r) => r.type === "person")
                  .map((result) => {
                    const globalIndex = displayResults.indexOf(result);
                    return (
                      <button
                        key={result.id}
                        data-result-index={globalIndex}
                        onClick={() => navigateToResult(result)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                          globalIndex === selectedIndex
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground hover:bg-accent/50",
                        )}
                      >
                        {renderIcon(result.icon)}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{result.title}</div>
                          {result.subtitle && (
                            <div className="truncate text-xs text-muted-foreground">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        {globalIndex === selectedIndex && (
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                &uarr;&darr;
              </kbd>
              navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                &crarr;
              </kbd>
              select
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                esc
              </kbd>
              close
            </span>
          </div>
          {query.trim() && (
            <button
              onClick={navigateToSearch}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Full search
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
