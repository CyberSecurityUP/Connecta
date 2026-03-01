"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createWorkspaceSchema, type CreateWorkspaceInput } from "@chat/shared";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function NewWorkspacePage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateWorkspaceInput>({
    name: "",
    slug: "",
    description: "",
  });

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = createWorkspaceSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path.join(".")] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<{ data: { slug: string } }>(
        "/workspaces",
        formData,
        { token: accessToken! },
      );

      toast.success("Workspace created!");
      router.push(`/${response.data.slug}`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Create a workspace</h1>
          <p className="mt-2 text-muted-foreground">
            A workspace is where your team communicates
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Workspace name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Acme Inc"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="slug" className="text-sm font-medium">
                Workspace URL
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">app.chat/</span>
                <input
                  id="slug"
                  type="text"
                  placeholder="acme"
                  className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="description"
                type="text"
                placeholder="What's this workspace for?"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create workspace"}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link href="/workspace/select" className="text-sm text-muted-foreground hover:text-foreground">
            Back to workspaces
          </Link>
        </div>
      </div>
    </div>
  );
}
