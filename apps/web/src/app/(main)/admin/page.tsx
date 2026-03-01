"use client";

import { Globe, MessageSquare, FileText, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

interface Stats {
  users: { total: number; lastWeek: number };
  workspaces: { total: number };
  channels: { total: number };
  messages: { total: number; last24h: number };
  files: { total: number };
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: Stats }>("/admin/stats", { token: accessToken })
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, [accessToken]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.users.total, sub: `+${stats.users.lastWeek} this week`, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Workspaces", value: stats.workspaces.total, sub: "Active workspaces", icon: Globe, color: "text-purple-600 bg-purple-50" },
    { label: "Messages", value: stats.messages.total, sub: `${stats.messages.last24h} in last 24h`, icon: MessageSquare, color: "text-green-600 bg-green-50" },
    { label: "Files", value: stats.files.total, sub: "Uploaded files", icon: FileText, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Platform overview and statistics</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              <div className={`rounded-lg p-2 ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold">{card.value.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Quick Info</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Channels</p>
            <p className="mt-1 text-2xl font-bold">{stats.channels.total}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Messages Today</p>
            <p className="mt-1 text-2xl font-bold">{stats.messages.last24h}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">New Users (7d)</p>
            <p className="mt-1 text-2xl font-bold">{stats.users.lastWeek}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
