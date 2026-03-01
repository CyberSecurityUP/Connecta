"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params.workspaceSlug as string;

  useEffect(() => {
    // Redirect to #general by default
    router.replace(`/${workspaceSlug}/channel/general`);
  }, [workspaceSlug, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
