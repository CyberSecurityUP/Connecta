"use client";

import { ArrowRight, Hash, MessageSquare, Search, Shield, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/stores/auth-store";

export default function Home() {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  // Redirect authenticated users to workspace
  useEffect(() => {
    if (accessToken) {
      router.replace("/workspace/select");
    }
  }, [accessToken, router]);

  // Don't render landing while redirecting
  if (accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Connecta</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            Open-source &middot; Self-hosted &middot; Free forever
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Team messaging,
            <br />
            <span className="text-primary">without the lock-in</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A modern, real-time messaging platform for teams. Channels, direct messages,
            threads, file sharing, and more. All open-source.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center rounded-lg border px-8 text-base font-medium transition-colors hover:bg-accent"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">Everything you need</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            Built for teams who value transparency, privacy, and control over their communication tools.
          </p>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Hash,
                title: "Channels",
                desc: "Organize conversations by topic, team, or project with public and private channels.",
              },
              {
                icon: MessageSquare,
                title: "Direct Messages",
                desc: "Private 1:1 and group conversations for quick discussions outside of channels.",
              },
              {
                icon: Zap,
                title: "Real-time",
                desc: "Instant message delivery with typing indicators, presence, and live updates.",
              },
              {
                icon: Search,
                title: "Powerful Search",
                desc: "Find any message, file, or person across your workspace in seconds.",
              },
              {
                icon: Users,
                title: "Workspaces",
                desc: "Create multiple workspaces with role-based access control and member management.",
              },
              {
                icon: Shield,
                title: "Self-hosted",
                desc: "Deploy on your own infrastructure. Your data stays under your control.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <MessageSquare className="h-3 w-3 text-primary-foreground" />
            </div>
            <span>Connecta</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Open-source team communication
          </p>
        </div>
      </footer>
    </div>
  );
}
