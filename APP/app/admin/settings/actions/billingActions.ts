//APP\app\admin\settings\actions\billingActions.ts
"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function startTrial() {
  const { org, member } = await getAdminContext();

  if (member.role !== "admin") {
    return { error: "Sadece admin deneme başlatabilir." };
  }

  const admin = supabaseServiceRoleClient();

  /* =========================
     1) SUBSCRIPTION VAR MI?
  ========================= */
  const { data: sub } = await admin
    .from("org_subscriptions")
    .select("*")
    .eq("org_id", org.id)
    .maybeSingle();

  /* =========================
     2) YOKSA → FREE OLUŞTUR
  ========================= */
  if (!sub) {
    const { error: insertErr } = await admin
      .from("org_subscriptions")
      .insert({
        org_id: org.id,
        plan: "free",
        status: "active",
        trial_used: false,
      });

    if (insertErr) {
      console.error("subscription insert error:", insertErr);
      return { error: "Abonelik oluşturulamadı." };
    }
  }

  /* =========================
     3) TEKRAR OKU
  ========================= */
  const { data: current } = await admin
    .from("org_subscriptions")
    .select("*")
    .eq("org_id", org.id)
    .single();

  if (current.plan !== "free") {
    return { error: "Deneme sadece free plan için kullanılabilir." };
  }

  if (current.trial_used) {
    return { error: "Deneme daha önce kullanılmış." };
  }

  /* =========================
     4) TRIAL BAŞLAT
  ========================= */
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: updateErr } = await admin
    .from("org_subscriptions")
    .update({
      plan: "trial",
      status: "active",
      expires_at: expiresAt.toISOString(),
      trial_used: true,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", org.id);

  if (updateErr) {
    console.error("trial update error:", updateErr);
    return { error: "Deneme başlatılamadı." };
  }

  /* =========================
     5) PREMIUM FLAG
  ========================= */
  await admin
    .from("organizations")
    .update({
      is_premium: true,
      premium_activated_at: new Date().toISOString(),
      premium_activated_by: member.user_id,
    })
    .eq("id", org.id);

  revalidatePath("/admin/settings");
  return { success: true };
}
