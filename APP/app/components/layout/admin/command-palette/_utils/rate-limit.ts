// APP/app/components/layout/admin/command-palette/_utils/rate-limit.ts

/**
 * Basit, hafif, memory-based rate limit.
 * Sunucu tarafında değil — client-side fetch kontrolü için.
 *
 * Kullanımı:
 *   if (!canCall("intent", 800)) return;
 *   if (!canCall("autocomplete", 300)) return;
 */

const lastCalls = new Map<string, number>();

export function canCall(key: string, cooldownMs: number) {
  const now = Date.now();
  const last = lastCalls.get(key) ?? 0;

  if (now - last < cooldownMs) {
    return false; // çok erken → API çağrısı yapılmasın
  }

  lastCalls.set(key, now);
  return true;
}
