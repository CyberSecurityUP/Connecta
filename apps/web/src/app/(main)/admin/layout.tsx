"use client";

import { BarChart3, Globe, ArrowLeft, Settings, Shield, Users, Webhook } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/workspaces", label: "Workspaces", icon: Globe },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: { isAdmin: boolean } }>("/admin/check", { token: accessToken })
      .then(() => setIsAdmin(true))
      .catch(() => {
        setIsAdmin(false);
        router.replace("/workspace/select");
      });
  }, [accessToken, router]);

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r bg-muted/30">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Link href="/workspace/select" className="rounded-md p-1 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Admin Panel</h2>
          </div>
        </div>
        <nav className="space-y-0.5 p-2">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)) &&
                  "bg-accent font-medium",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
