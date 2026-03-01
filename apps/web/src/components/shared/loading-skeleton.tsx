"use client";

import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-2 py-2">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function MessageListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4 px-4 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChannelListSkeleton() {
  return (
    <div className="space-y-1 px-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center px-4 py-8">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="mt-4 h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-28" />
      <div className="mt-8 w-full max-w-lg space-y-4">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
