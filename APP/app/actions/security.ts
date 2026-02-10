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
    .select(`
      id,
      device_hash,
      label,
      platform,
      last_seen_at,
      trusted_devices!left (
        trusted_until
      )
    `)
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .order("last_seen_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((d: any) => ({
    id: d.id,
    device_hash: d.device_hash, // 🔥 KRİTİK
    name: d.label ?? "Bilinmeyen cihaz",
    platform: d.platform,
    lastSeenAt: d.last_seen_at,
    trusted:
      !!(
        d.trusted_devices?.trusted_until &&
        new Date(d.trusted_devices.trusted_until).getTime() > Date.now()
      ),
  }));
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
 * Cihazın trusted durumunu kaldırır (revoke)
 * RPC: toggle_device_trust(user_id, org_id, device_hash)
 */
export async function toggleTrustedDevice(
  userId: string,
  orgId: string,
  deviceHash: string
) {
  const admin = supabaseServiceRoleClient();

  console.log("[SERVER] toggleTrustedDevice called", {
    userId,
    orgId,
    deviceHash,
  });

  const { data: existing } = await admin
    .from("trusted_devices")
    .select("id, trusted_until")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .eq("device_hash", deviceHash)
    .maybeSingle();

  console.log("[SERVER] existing trusted device", existing);

  if (existing) {
    console.log("[SERVER] removing trust");
    await admin.from("trusted_devices").delete().eq("id", existing.id);
  } else {
    console.log("[SERVER] adding trust");
    await admin.from("trusted_devices").insert({
      user_id: userId,
      org_id: orgId,
      device_hash: deviceHash,
      trusted_until: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  }
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
