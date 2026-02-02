// APP/app/components/layout/admin/command-palette/commands.ts
"use client";

import { CommandItemType } from "./CommandPaletteProvider";
import { useRouter } from "next/navigation";
import { useSettings } from "../settings/useSettings";
import { NAV_ITEMS } from "../navigation/nav-config";

export function useDefaultCommands(
  openSettings: () => void,
  openNotifications: () => void,
  logout: () => void
): CommandItemType[] {
  const router = useRouter();
  const { settings, setSettings } = useSettings();

  const navCommands: CommandItemType[] = [];

  // === Navigation Commands ===
  NAV_ITEMS.forEach((item) => {
    if (item.href) {
      navCommands.push({
        id: `go${item.href.replace(/\//g, "-")}`,
        category: "navigation",
        label: `${item.label} sayfasına git`,
        action: () => router.push(item.href!),
      });
    }

    if (item.children) {
      item.children.forEach((child) => {
        navCommands.push({
          id: `go${child.href.replace(/\//g, "-")}`,
          category: "navigation",
          label: `${child.label} sayfasına git`,
          action: () => router.push(child.href),
        });
      });
    }
  });

  // === Quick Actions ===
  const quickActions: CommandItemType[] = [
    {
      id: "quick-new-audit",
      category: "quick",
      label: "Yeni Denetim Oluştur",
      shortcut: "A",
      action: () => router.push("/operator/new"),
    },
    {
      id: "quick-new-user",
      category: "quick",
      label: "Yeni Kullanıcı Ekle",
      shortcut: "U",
      action: () => router.push("/admin/users/new"),
    },
  ];

  // === Sistem komutları ===
  const systemCommands: CommandItemType[] = [
    {
      id: "theme-toggle",
      category: "system",
      label: settings.theme === "dark" ? "Aydınlık tema" : "Karanlık tema",
      shortcut: "T",
      action: () =>
        setSettings({
          ...settings,
          theme: settings.theme === "dark" ? "light" : "dark",
        }),
    },
    {
      id: "open-settings",
      category: "system",
      label: "Ayarlar panelini aç",
      shortcut: "S",
      action: openSettings,
    },
    {
      id: "open-notifications",
      category: "system",
      label: "Bildirim panelini aç",
      shortcut: "N",
      action: openNotifications,
    },
    {
      id: "logout",
      category: "system",
      label: "Çıkış yap",
      shortcut: "L",
      action: logout,
    },
  ];

  return [...navCommands, ...quickActions, ...systemCommands];
}
