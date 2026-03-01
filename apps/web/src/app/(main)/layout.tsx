"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SocketProvider } from "@/components/providers/socket-provider";
import { useAuthStore } from "@/stores/auth-store";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      router.push("/login");
    }
  }, [accessToken, router]);

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <SocketProvider>{children}</SocketProvider>;
}
