import intentMap from "../config/intentMap.json";
import { CommandItemType } from "../CommandPaletteProvider";
import { useRouter } from "next/navigation";

export function useSystemCommands(): CommandItemType[] {
  const router = useRouter();

  return Object.entries(intentMap).map(([intent, data]: any) => ({
    id: intent,
    label: data.label,
    shortcut: data.shortcut,
    category: "navigation",
    action: () => {
      if (data.path) router.push(data.path);
    }
  }));
}
