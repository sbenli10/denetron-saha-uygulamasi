// aiMemoryStore.ts
"use client";

export type MemoryEntry = {
  id: string;
  label: string;
  score: number; // kullanım sıklığı
};

const KEY = "denetron-ai-command-memory";

/**
 * Memory yükle
 */
export function loadMemory(): MemoryEntry[] {
  try {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Memory kaydet
 */
function saveMemory(data: MemoryEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

/**
 * Komutu öğren
 */
export function learnCommand(id: string, label: string) {
  const store = loadMemory();
  const existing = store.find((m) => m.id === id);

  if (existing) {
    existing.score += 1; // kullanım skoru arttır
  } else {
    store.push({ id, label, score: 1 });
  }

  saveMemory(store);
}

/**
 * En çok kullanılan komutlar → sıralı
 */
export function getTopCommands(limit = 5) {
  return loadMemory()
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
