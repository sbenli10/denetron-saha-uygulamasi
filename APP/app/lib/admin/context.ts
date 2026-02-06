import { redirect } from "next/navigation";
import {
  supabaseServerClient,
  supabaseServiceRoleClient,
} from "@/lib/supabase/server";

/**
 * ADMIN SERVER CONTEXT (HARDENED)
 *
 * - Auth yoksa → login
 * - 1 kullanıcı = 1 aktif org (en yeni)
 * - Rol her zaman resolve edilir
 * - Bozuk veri → fail-closed
 * - TS strict uyumlu
 */
export async function getAdminContext() {
  /* -------------------------------------------------- */
  /* 1) AUTH (SERVER COOKIE)                            */
  /* -------------------------------------------------- */
  const supabase = supabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const admin = supabaseServiceRoleClient();

  /* -------------------------------------------------- */
  /* 2) ORG MEMBERSHIP (TEK AKTİF KAYIT)                */
  /* -------------------------------------------------- */
  const { data: member, error: memberError } = await admin
    .from("org_members")
    .select("id, org_id, role, role_id, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (memberError || !member || !member.org_id) {
    // Üyelik yok veya bozuk → güvenli çıkış
    redirect("/login");
  }

  /* -------------------------------------------------- */
  /* 3) ROLE RESOLUTION (TS + RBAC SAFE)                */
  /* -------------------------------------------------- */
  type Role = "admin" | "manager" | "operator";

  let resolvedRole: string | null = null;

  // 3.a roles tablosundan çöz
  if (member.role_id) {
    const { data: roleRow } = await admin
      .from("roles")
      .select("name")
      .eq("id", member.role_id)
      .maybeSingle();

    if (roleRow?.name && typeof roleRow.name === "string") {
      resolvedRole = roleRow.name.toLowerCase();
    }
  }

  // 3.b fallback: org_members.role
  if (!resolvedRole && member.role) {
    resolvedRole = member.role.toLowerCase();
  }

  // 3.c whitelist + default
  const effectiveRole: Role =
    resolvedRole === "admin" ||
    resolvedRole === "manager" ||
    resolvedRole === "operator"
      ? resolvedRole
      : "operator";

  // 3.d admin guard
  if (effectiveRole === "operator") {
    redirect("/operator");
  }

  /* -------------------------------------------------- */
  /* 4) PROFILE (ZORUNLU)                               */
  /* -------------------------------------------------- */
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect("/login");
  }

  /* -------------------------------------------------- */
  /* 5) ORGANIZATION (ZORUNLU)                          */
  /* -------------------------------------------------- */
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name, slug, is_premium")
    .eq("id", member.org_id)
    .maybeSingle();

  if (orgError || !org) {
    redirect("/login");
  }

  /* -------------------------------------------------- */
  /* 6) ORG SETTINGS (OPSİYONEL)                        */
  /* -------------------------------------------------- */
  const { data: settings } = await admin
    .from("org_settings")
    .select("*")
    .eq("org_id", member.org_id)
    .maybeSingle();

  /* -------------------------------------------------- */
  /* 7) STABLE RETURN                                   */
  /* -------------------------------------------------- */
  return {
    user,
    user_id: user.id,

    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
    },

    member: {
      id: member.id,
      user_id: user.id,
      org_id: member.org_id,
      role: effectiveRole,
      role_name: effectiveRole,
      created_at: member.created_at,
    },

    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      is_premium: org.is_premium ?? false,
      settings: settings ?? null,
    },
  };
}
