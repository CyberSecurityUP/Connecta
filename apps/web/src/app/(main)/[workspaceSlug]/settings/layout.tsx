"use client";

import { ArrowLeft, Globe, Mail, Shield, Users, Webhook } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const settingsNav = [
  { href: "", label: "General", icon: Globe },
  { href: "/members", label: "Members", icon: Users },
  { href: "/roles", label: "Roles & Permissions", icon: Shield },
  { href: "/invitations", label: "Invitations", icon: Mail },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const workspaceSlug = params.workspaceSlug as string;
  const basePath = `/${workspaceSlug}/settings`;

  return (
    <div className="flex flex-1">
      <aside className="w-56 border-r bg-muted/30">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Link href={`/${workspaceSlug}`} className="rounded-md p-1 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="font-semibold">Settings</h2>
        </div>
        <nav className="space-y-0.5 p-2">
          {settingsNav.map((item) => {
            const href = `${basePath}${item.href}`;
            const isActive = pathname === href || (item.href === "" && pathname === basePath);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                  isActive && "bg-accent font-medium",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
