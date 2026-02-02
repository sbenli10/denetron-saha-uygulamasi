// APP/app/api/ai/_core/keyword-map.ts

export const KEYWORD_MAP = [
  { keywords: ["users", "kullanıcı", "üyeler"], intent: "open_users", score: 0.55 },
  { keywords: ["tasks", "görev"], intent: "open_tasks", score: 0.55 },
  { keywords: ["settings", "ayar"], intent: "open_settings", score: 0.60 },
  { keywords: ["notifications", "bildirim"], intent: "open_notifications", score: 0.60 },
  { keywords: ["logout", "çıkış"], intent: "logout", score: 0.70 },
];

export function matchKeywordIntent(query: string) {
  const q = query.toLowerCase();

  for (const row of KEYWORD_MAP) {
    if (row.keywords.some((k) => q.includes(k))) {
      return { intent: row.intent, confidence: row.score };
    }
  }
  return null;
}
