"use client";

import { ArrowLeft, Bell, Lock, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const accountNav = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/security", label: "Security", icon: Lock },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-muted/30">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Link href="/workspace/select" className="rounded-md p-1 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="font-semibold">Account</h2>
        </div>
        <nav className="space-y-0.5 p-2">
          {accountNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                pathname === item.href && "bg-accent font-medium",
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
