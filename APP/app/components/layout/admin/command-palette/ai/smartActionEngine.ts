import { CommandItemType } from "../CommandPaletteProvider";
import { matchAICommand } from "./aiCommandEngine";
import { addSmartCommand } from "./smartActions";

export function detectUnknownCommand(query: string, commands: CommandItemType[]) {
  const match = matchAICommand(query, commands);
  return match ? null : query.trim();
}

export function createSmartCommand(query: string, router: any) {
  const id = "smart-" + Date.now();

  const cmd = {
    id,
    phrase: query,
    createdAt: Date.now(),
    action: () => {
      // Minimum viable action: yönlendirme denemesi
      const normalized = query
        .replace("git", "")
        .replace("aç", "")
        .replace("ekranı", "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      router.push("/admin/" + normalized);
    },
  };

  addSmartCommand(cmd);
  return cmd;
}
