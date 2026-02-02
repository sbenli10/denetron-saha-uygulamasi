// APP/app/components/layout/admin/command-palette/CommandRouter.ts
"use client";

import { useRouter } from "next/navigation";
import { useSettings } from "../settings/useSettings";
import { useNotifications } from "../notifications/NotificationProvider";
import { learnCommand } from "./ai/aiMemoryStore";

export type CommandActionType = {
  id: string;
  label: string;
  action: () => Promise<void> | void;
};

export function useCommandRouter({
  openSettings,
  openNotifications,
  logout,
}: {
  openSettings: () => void;
  openNotifications: () => void;
  logout: () => void;
}) {
  const router = useRouter();
  const { settings, setSettings } = useSettings();
  const { markAllAsRead } = useNotifications();

  const executeIntent = async (intent: string) => {
    switch (intent) {
      case "open_submissions":
        router.push("/admin/submissions");
        break;

      case "open_users":
        router.push("/admin/users");
        break;

      case "open_tasks":
        router.push("/admin/tasks");
        break;

      case "open_ai_analysis":
        router.push("/admin/ai");
        break;

      case "toggle_theme":
        setSettings({
          ...settings,
          theme: settings.theme === "dark" ? "light" : "dark",
        });
        break;

      case "open_settings":
        openSettings();
        break;

      case "open_notifications":
        openNotifications();
        break;

      case "mark_notifications_read":
        markAllAsRead();
        break;

      case "logout":
        logout();
        break;

      default:
        console.warn("Unknown intent:", intent);
        break;
    }

    // AI Memory
    learnCommand(intent, intent);
  };

  const executeCommand = async (id: string) => {
    await executeIntent(id);
  };

  return { executeIntent, executeCommand };
}
