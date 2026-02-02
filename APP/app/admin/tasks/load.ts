// APP/app/admin/tasks/load.ts
"use server";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function loadTaskData() {
  const { member, org } = await getAdminContext();

  if (!member || !org) {
    throw new Error("Organizasyon bilgisi bulunamadı.");
  }

  const db = supabaseServiceRoleClient();

  /* -----------------------------
     1) Templates (SADECE ATANABİLİRLER)
     KURAL: is_active = true AND is_archived = false
  ----------------------------- */
  const templatesRes = await db
    .from("templates")
    .select("id, name")
    .eq("org_id", member.org_id)
    .eq("is_archived", false)
    .eq("is_active", true);

  if (templatesRes.error) {
    console.error("[loadTaskData] Templates Error:", templatesRes.error);
    throw new Error("Şablonlar yüklenirken hata oluştu.");
  }

  const templates =
    templatesRes.data?.map((t) => ({
      id: String(t.id),
      name: t.name,
    })) ?? [];

  /* -----------------------------
     2) Operators (org_members)
  ----------------------------- */
  const operatorsRes = await db
    .from("org_members")
    .select("user_id, role")
    .eq("org_id", member.org_id)
    .eq("role", "operator");

  if (operatorsRes.error) {
    console.error("[loadTaskData] Operators Error:", operatorsRes.error);
    throw new Error("Operatörler yüklenirken hata oluştu.");
  }

  const operatorIds = operatorsRes.data.map((o) => o.user_id);

  /* -----------------------------
     3) Profiles
  ----------------------------- */
  const profilesRes = await db
    .from("profiles")
    .select("id, full_name, email")
    .in(
      "id",
      operatorIds.length ? operatorIds : ["00000000-0000-0000-0000-000000000000"]
    );

  if (profilesRes.error) {
    console.error("[loadTaskData] Profiles Error:", profilesRes.error);
    throw new Error("Profiller yüklenirken hata oluştu.");
  }

  const profileMap = Object.fromEntries(
    profilesRes.data.map((p) => [p.id, p])
  );

  const operators = operatorsRes.data.map((o) => ({
    id: o.user_id,
    full_name: profileMap[o.user_id]?.full_name ?? "Operatör",
    email: profileMap[o.user_id]?.email ?? null,
  }));

  return {
    templates,
    operators,
    isPremium: org.is_premium,
    role: member.role,
  };
}
