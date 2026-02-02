// APP/app/api/ai/_core/normalize.ts

export function normalizeQuery(q: string) {
  let s = q.toLowerCase().trim();

  // Common Turkish → English normalization
  s = s.replace("kullanıcılar", "users");
  s = s.replace("üye", "users");
  s = s.replace("üyeler", "users");

  s = s.replace("görevler", "tasks");
  s = s.replace("görev", "task");

  s = s.replace("ayarlar", "settings");
  s = s.replace("bildirimler", "notifications");

  s = s.replace("çıkış yap", "logout");
  s = s.replace("oturumu kapat", "logout");

  // English synonyms
  s = s.replace("people", "users");
  s = s.replace("members", "users");

  return s;
}
