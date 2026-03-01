"use client";

import { ArrowLeft, Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { User } from "@chat/shared";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { usePresenceStore } from "@/stores/presence-store";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const workspaceSlug = params.workspaceSlug as string;
  const { accessToken } = useAuthStore();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const presence = usePresenceStore((s) => s.getPresence(userId));

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: any }>(`/users/${userId}`, { token: accessToken })
      .then((res) => setProfile(res.data))
      .finally(() => setIsLoading(false));
  }, [accessToken, userId]);

  if (isLoading || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const statusColors = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    dnd: "bg-red-500",
    offline: "bg-gray-400",
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <Link
          href={`/${workspaceSlug}`}
          className="rounded-md p-1 hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-8">
          {/* Avatar + Status */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
                {(profile.displayName || profile.name || "?").charAt(0).toUpperCase()}
              </div>
              <div
                className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-background ${statusColors[presence.status]}`}
              />
            </div>

            <h2 className="mt-4 text-2xl font-bold">
              {profile.displayName || profile.name}
            </h2>

            {profile.title && (
              <p className="mt-1 text-muted-foreground">{profile.title}</p>
            )}

            {profile.customStatus && (
              <p className="mt-2 rounded-full bg-muted px-3 py-1 text-sm">
                {profile.customStatus}
              </p>
            )}
          </div>

          {/* Details */}
          <div className="mt-8 space-y-4">
            {profile.bio && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">About</h3>
                <p className="mt-1 text-sm">{profile.bio}</p>
              </div>
            )}

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}

              {profile.timezone && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.timezone}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Joined {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <button className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Send message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
