// APP/lib/admin/context.ts
import { redirect } from "next/navigation";
import {
  supabaseServerClient,
  supabaseServiceRoleClient,
} from "@/lib/supabase/server";

export async function getAdminContext() {
  const supabase = supabaseServerClient();

  /* ------------------------------------------------------------------ */
  /* 1) AUTH                                                            */
  /* ------------------------------------------------------------------ */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = supabaseServiceRoleClient();

  /* ------------------------------------------------------------------ */
  /* 2) ORG MEMBERSHIP                                                   */
  /* ------------------------------------------------------------------ */
  const { data: members } = await admin
    .from("org_members")
    .select("org_id, role, role_id, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const member = members?.[0];
  if (!member) redirect("/login");

  /* ------------------------------------------------------------------ */
  /* 3) ROLE RESOLUTION                                                  */
  /* ------------------------------------------------------------------ */
  let resolvedRole: string | null = null;

  if (member.role_id) {
    const { data: roleRow } = await admin
      .from("roles")
      .select("name")
      .eq("id", member.role_id)
      .maybeSingle();

    resolvedRole = roleRow?.name ?? null;
  }

  const effectiveRole =
    resolvedRole ??
    member.role ??
    "operator";

  if (!["admin", "manager"].includes(effectiveRole.toLowerCase())) {
    redirect("/operator");
  }

  /* ------------------------------------------------------------------ */
  /* 4) PROFILE                                                         */
  /* ------------------------------------------------------------------ */
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  /* ------------------------------------------------------------------ */
  /* 5) ORGANIZATION                                                     */
  /* ------------------------------------------------------------------ */
  const { data: org } = await admin
    .from("organizations")
    .select("id, name, is_premium")
    .eq("id", member.org_id)
    .maybeSingle();

  if (!org) redirect("/login");

  /* ------------------------------------------------------------------ */
  /* 6) ORG SETTINGS  🔥 KRİTİK DÜZELTME                                 */
  /* ------------------------------------------------------------------ */
  const { data: settings } = await admin
    .from("org_settings")
    .select("*")
    .eq("org_id", member.org_id)
    .maybeSingle();

  /* ------------------------------------------------------------------ */
  /* 7) RETURN CONTEXT                                                   */
  /* ------------------------------------------------------------------ */
  return {
    user,
    user_id: user.id,
    profile,
    member: {
      ...member,
      user_id: user.id,
      role_name: effectiveRole,
    },
    org: {
      ...org,
      settings: settings ?? {}, // 🔥 ARTIK GERÇEK VERİ
    },
  };
}
