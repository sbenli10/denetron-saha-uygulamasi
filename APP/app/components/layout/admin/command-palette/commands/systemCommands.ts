// APP/app/components/layout/admin/command-palette/commands/systemCommands.ts

import { CommandItemType } from "../CommandPaletteProvider";
import { useRouter } from "next/navigation";

export function useSystemCommands(): CommandItemType[] {
  const router = useRouter();

  return [
    {
      id: "open_users",
      label: "Kullanıcı Yönetimi - Üyeler",
      action: () => router.push("/admin/users"),
      category: "navigation",
    },
    {
      id: "open_roles",
      label: "Kullanıcı Yönetimi - Roller",
      action: () => router.push("/admin/roles"),
      category: "navigation",
    },
    {
      id: "open_tasks",
      label: "Görev Atama",
      action: () => router.push("/admin/tasks"),
      category: "navigation",
    },
    {
      id: "open_settings",
      label: "Ayarlar",
      action: () => {},
      category: "system",
    },
    {
      id: "open_notifications",
      label: "Bildirimler",
      action: () => {},
      category: "system",
    },
  ];
}
