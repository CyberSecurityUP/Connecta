"use client";

import { useState } from "react";
import { toast } from "sonner";

import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export default function SecurityPage() {
  const { accessToken } = useAuthStore();
  const [isChanging, setIsChanging] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (!accessToken) return;

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChanging(true);
    try {
      await apiClient.post(
        "/users/me/change-password",
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        { token: accessToken },
      );
      toast.success("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to change password");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Security</h1>
      <p className="mt-1 text-muted-foreground">Manage your password and security settings</p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Change Password</h2>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <input
              type="password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">New Password</label>
            <input
              type="password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={isChanging || !form.currentPassword || !form.newPassword}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isChanging ? "Changing..." : "Change password"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold">Active Sessions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your active sessions across devices
        </p>
        <div className="mt-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current session</p>
              <p className="text-sm text-muted-foreground">Active now</p>
            </div>
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
