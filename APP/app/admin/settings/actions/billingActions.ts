"use server";

import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export async function startTrial() {
  const { org, member } = await getAdminContext();

  if (member.role !== "admin") {
    return { error: "Yetkisiz" };
  }

  const admin = supabaseServiceRoleClient();

  const { data: sub } = await admin
    .from("org_subscriptions")
    .select("*")
    .eq("org_id", org.id)
    .single();

  if (sub?.trial_used) {
    return { error: "Trial zaten kullanıldı" };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await admin.from("org_subscriptions").upsert({
    org_id: org.id,
    plan: "trial",
    status: "active",
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    trial_used: true,
  });

  await admin
    .from("organizations")
    .update({ is_premium: true })
    .eq("id", org.id);

  return { success: true };
}
