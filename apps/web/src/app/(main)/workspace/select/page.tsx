"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Workspace } from "@chat/shared";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const { accessToken, logout } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<(Workspace & { role: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    apiClient
      .get<{ data: (Workspace & { role: string })[] }>("/workspaces", { token: accessToken })
      .then((res) => {
        setWorkspaces(res.data);
        // If user has exactly one workspace, redirect directly
        if (res.data.length === 1) {
          router.push(`/${res.data[0].slug}`);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [accessToken, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="w-full max-w-lg px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Your Workspaces</h1>
          <p className="mt-2 text-muted-foreground">Select a workspace to continue</p>
        </div>

        {workspaces.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
            <p className="text-muted-foreground">You haven&apos;t joined any workspaces yet.</p>
            <Link
              href="/workspace/new"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create a workspace
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/${ws.slug}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{ws.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {ws.memberCount} member{ws.memberCount !== 1 ? "s" : ""} &middot;{" "}
                    <span className="capitalize">{ws.role.toLowerCase()}</span>
                  </p>
                </div>
              </Link>
            ))}

            <Link
              href="/workspace/new"
              className="flex items-center gap-4 rounded-lg border border-dashed p-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed text-2xl text-muted-foreground">
                +
              </div>
              <div>
                <h3 className="font-semibold">Create a new workspace</h3>
                <p className="text-sm text-muted-foreground">Start a new team or project</p>
              </div>
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
