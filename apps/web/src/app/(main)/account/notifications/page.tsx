"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState({
    desktopNotifications: true,
    soundEnabled: true,
    mentionsOnly: false,
    dmNotifications: true,
    threadReplies: true,
  });

  const handleToggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    toast.success("Notification preferences saved");
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Notification Preferences</h1>
      <p className="mt-1 text-muted-foreground">Control how you receive notifications</p>

      <div className="mt-8 space-y-6">
        {[
          { key: "desktopNotifications" as const, label: "Desktop notifications", desc: "Show browser push notifications" },
          { key: "soundEnabled" as const, label: "Notification sounds", desc: "Play a sound for new notifications" },
          { key: "mentionsOnly" as const, label: "Mentions only", desc: "Only notify when you are @mentioned" },
          { key: "dmNotifications" as const, label: "Direct message notifications", desc: "Notify for all new direct messages" },
          { key: "threadReplies" as const, label: "Thread replies", desc: "Notify when someone replies to your thread" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <button
              onClick={() => handleToggle(item.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs[item.key] ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  prefs[item.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
