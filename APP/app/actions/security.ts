// APP/app/actions/security.ts
"use server";

import { supabaseServiceRoleClient } from "@/lib/supabase/server";

const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000; // 5 dakika

/* =====================================================
 * 📌 AKTİF OTURUMLAR
 * ===================================================== */

/**
 * Kullanıcının aktif oturumlarını getirir
 * UI: getSessions()
 */
export async function getSessions(userId: string, orgId: string) {
  const admin = supabaseServiceRoleClient();

  const { data, error } = await admin
    .from("device_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .order("last_seen_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/* =====================================================
 * 📌 CİHAZLAR
 * ===================================================== */

/**
 * Kullanıcının cihaz listesini getirir
 * UI: getDevices()
 */
export async function getDevices(userId: string, orgId: string) {
  const admin = supabaseServiceRoleClient();

  const { data, error } = await admin
    .from("devices")
    .select("*")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .order("last_seen_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/* =====================================================
 * 🔐 TEK OTURUM KAPAT
 * ===================================================== */

/**
 * Tek bir oturumu kapatır
 * UI: revokeSession(s.sessionId)
 *
 * NOT: Burada session_id (refresh_token) kullanıyoruz
 */
export async function revokeSession(sessionId: string) {
  const admin = supabaseServiceRoleClient();

  const { error } = await admin
    .from("device_sessions")
    .delete()
    .eq("session_id", sessionId);

  if (error) throw error;
}

/* =====================================================
 * 🔐 DİĞER TÜM OTURUMLARI KAPAT (CURRENT HARİÇ)
 * ===================================================== */

/**
 * Mevcut oturum hariç tüm oturumları kapatır
 * UI: revokeAllSessionsExceptCurrent(userId, currentSessionId)
 */
export async function revokeAllSessionsExceptCurrent(
  userId: string,
  currentSessionId: string
) {
  const admin = supabaseServiceRoleClient();

  const { error } = await admin
    .from("device_sessions")
    .delete()
    .eq("user_id", userId)
    .neq("session_id", currentSessionId);

  if (error) throw error;
}

/* =====================================================
 * 🔁 GÜVENİLİR CİHAZ TOGGLE
 * ===================================================== */

/**
 * Cihazın trusted durumunu tersine çevirir
 * DB tarafında RPC kullanılır
 */
export async function toggleTrustedDevice(deviceId: string) {
  const admin = supabaseServiceRoleClient();

  const { error } = await admin.rpc("toggle_device_trust", {
    device_id: deviceId,
  });

  if (error) throw error;
}

/* =====================================================
 * 🟢 LAST SEEN GÜNCELLE (SESSION BAZLI)
 * ===================================================== */

/**
 * Oturumun last_seen_at alanını throttle’lı günceller
 * Middleware veya layout içinde çağrılabilir
 */
export async function updateLastSeen(
  userId: string,
  sessionId: string
) {
  const admin = supabaseServiceRoleClient();

  const { data, error } = await admin
    .from("device_sessions")
    .select("last_seen_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error || !data) return;

  const lastSeenTs = data.last_seen_at
    ? new Date(data.last_seen_at).getTime()
    : 0;

  if (Date.now() - lastSeenTs < LAST_SEEN_THROTTLE_MS) return;

  await admin
    .from("device_sessions")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("session_id", sessionId);
}
