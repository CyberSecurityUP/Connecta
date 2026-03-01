"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

interface InvitationInfo {
  id: string;
  workspaceId: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  invitedBy: {
    name: string;
    displayName: string | null;
  };
}

type PageState = "loading" | "ready" | "accepting" | "error";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { accessToken, user } = useAuthStore();

  const [state, setState] = useState<PageState>("loading");
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!accessToken || !token) return;

    apiClient
      .get<{ data: InvitationInfo }>(`/invitations/${token}`, { token: accessToken })
      .then((res) => {
        setInvitation(res.data);
        setState("ready");
      })
      .catch((error) => {
        if (error instanceof ApiError) {
          if (error.status === 404) {
            setErrorMessage("This invitation link is invalid or has already been used.");
          } else if (error.status === 403) {
            setErrorMessage("This invitation has expired. Please ask for a new one.");
          } else {
            setErrorMessage(error.message);
          }
        } else {
          setErrorMessage("Something went wrong. Please try again later.");
        }
        setState("error");
      });
  }, [accessToken, token]);

  const handleAccept = async () => {
    if (!accessToken) return;

    setState("accepting");
    try {
      const res = await apiClient.post<{ data: { workspaceSlug: string } }>(
        `/invitations/${token}/accept`,
        undefined,
        { token: accessToken },
      );

      toast.success("You have joined the workspace!");
      router.push(`/${res.data.workspaceSlug}`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrorMessage("This invitation has already been accepted.");
        } else if (error.status === 403) {
          setErrorMessage("This invitation has expired. Please ask for a new one.");
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("Failed to accept the invitation. Please try again.");
      }
      setState("error");
    }
  };

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="mx-auto w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold">You have been invited</h1>
            <p className="mt-2 text-muted-foreground">
              Please log in to accept this invitation.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Log in to continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="mx-auto w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading invitation...
            </p>
          </div>
        )}

        {state === "ready" && invitation && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
              {invitation.workspace.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-bold">
              Join {invitation.workspace.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {invitation.invitedBy.displayName || invitation.invitedBy.name} has
              invited you to join as a{" "}
              <span className="font-medium capitalize">
                {invitation.role.toLowerCase()}
              </span>
              .
            </p>

            {user && (
              <p className="mt-3 text-xs text-muted-foreground">
                Signed in as {user.email}
              </p>
            )}

            <button
              onClick={handleAccept}
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Accept Invitation
            </button>

            <Link
              href="/workspace/select"
              className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground"
            >
              Back to workspaces
            </Link>
          </div>
        )}

        {state === "accepting" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Joining...</p>
          </div>
        )}

        {state === "error" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <svg
                className="h-6 w-6 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Unable to join</h1>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            <Link
              href="/workspace/select"
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to workspaces
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
