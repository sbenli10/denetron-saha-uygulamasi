// app/components/layout/admin/command-palette/ai/aiCommandEngine.ts

import { CommandItemType } from "../CommandPaletteProvider";

export function matchAICommand(input: string, commands: CommandItemType[]) {
  const text = input.toLowerCase().trim();

  // 1) Direkt eşleşme
  const exact = commands.find((cmd) =>
    cmd.label.toLowerCase() === text
  );
  if (exact) return exact;

  // 2) Kısmi match
  const partial = commands.find((cmd) =>
    cmd.label.toLowerCase().includes(text)
  );
  if (partial) return partial;

  // 3) NLP → intent eşleme
  const map: Record<string, string[]> = {
    "yeni denetim": ["denetim oluştur", "audit", "inspection"],
    "ayarlar": ["settings", "config", "konfigürasyon"],
    "kullanıcı ekle": ["new user", "user add", "üyelik"],
    "bildirim": ["notification", "noti", "bildirimleri aç"],
    "tema": ["dark mode", "light mode"],
    "görev": ["task", "assign"],
    "ai": ["analiz", "rapor", "machine learning", "yapay zeka"],
  };

  for (const cmd of commands) {
    const label = cmd.label.toLowerCase();

    for (const key in map) {
      if (label.includes(key)) {
        for (const keyword of map[key]) {
          if (text.includes(keyword) || text.includes(key)) {
            return cmd;
          }
        }
      }
    }
  }

  return null;
}
