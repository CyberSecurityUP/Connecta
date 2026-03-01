"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function AccountProfilePage() {
  const { accessToken, user, setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    title: "",
    bio: "",
    phone: "",
    timezone: "",
  });

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ data: any }>("/users/me", { token: accessToken })
      .then((res) => {
        const u = res.data;
        setForm({
          displayName: u.displayName || u.name || "",
          title: u.title || "",
          bio: u.bio || "",
          phone: u.phone || "",
          timezone: u.timezone || "UTC",
        });
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const handleSave = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const res = await apiClient.patch<{ data: any }>("/users/me", form, { token: accessToken });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="mt-1 text-muted-foreground">Manage your personal information</p>

      <div className="mt-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {(form.displayName || "?").charAt(0).toUpperCase()}
          </div>
          <button className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-accent">
            Change avatar
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              placeholder="e.g., Software Engineer"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Tell us about yourself"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <input
              type="tel"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Timezone</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="America/Sao_Paulo">Brasilia Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Central European</option>
              <option value="Asia/Tokyo">Japan</option>
              <option value="Asia/Shanghai">China</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
