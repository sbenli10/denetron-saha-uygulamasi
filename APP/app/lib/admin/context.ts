// APP/app/lib/admin/context.ts
import { redirect } from "next/navigation";
import {
  supabaseServerClient,
  supabaseServiceRoleClient,
} from "@/lib/supabase/server";

/**
 * ADMIN SERVER CONTEXT (FINAL)
 *
 * - Auth yoksa → login
 * - 1 kullanıcı = 1 aktif org (en yeni)
 * - Rol resolve edilir (RBAC safe)
 * - Subscription SINGLE SOURCE OF TRUTH
 * - Trial = Premium access
 * - Fail-closed
 */
export async function getAdminContext() {
  /* -------------------------------------------------- */
  /* 1) AUTH                                            */
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
  /* 2) ORG MEMBERSHIP                                  */
  /* -------------------------------------------------- */
  const { data: member } = await admin
    .from("org_members")
    .select("id, org_id, role, role_id, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!member?.org_id) {
    redirect("/login");
  }

  /* -------------------------------------------------- */
  /* 3) ROLE RESOLUTION                                 */
  /* -------------------------------------------------- */
  type Role = "admin" | "manager" | "operator";
  let resolvedRole: string | null = null;

  if (member.role_id) {
    const { data: roleRow } = await admin
      .from("roles")
      .select("name")
      .eq("id", member.role_id)
      .maybeSingle();

    if (roleRow?.name) {
      resolvedRole = roleRow.name.toLowerCase();
    }
  }

  if (!resolvedRole && member.role) {
    resolvedRole = member.role.toLowerCase();
  }

  const effectiveRole: Role =
    resolvedRole === "admin" ||
    resolvedRole === "manager" ||
    resolvedRole === "operator"
      ? resolvedRole
      : "operator";

  if (effectiveRole === "operator") {
    redirect("/operator");
  }

  /* -------------------------------------------------- */
  /* 4) PROFILE                                         */
  /* -------------------------------------------------- */
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  /* -------------------------------------------------- */
  /* 5) ORGANIZATION                                    */
  /* -------------------------------------------------- */
  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug, is_premium")
    .eq("id", member.org_id)
    .maybeSingle();

  if (!org) {
    redirect("/login");
  }

  /* -------------------------------------------------- */
  /* 6) SUBSCRIPTION (SOURCE OF TRUTH)                  */
  /* -------------------------------------------------- */
  const { data: subscription } = await admin
    .from("org_subscriptions")
    .select("plan, status, expires_at, trial_used")
    .eq("org_id", member.org_id)
    .maybeSingle();

  const safeSubscription = subscription ?? {
    plan: "free",
    status: "active",
    expires_at: null,
    trial_used: false,
  };

  const hasPremiumAccess =
    safeSubscription.plan === "trial" ||
    safeSubscription.plan === "premium";

  /* -------------------------------------------------- */
  /* 7) ORG SETTINGS (OPTIONAL)                         */
  /* -------------------------------------------------- */
  const { data: settings } = await admin
    .from("org_settings")
    .select("*")
    .eq("org_id", member.org_id)
    .maybeSingle();

  /* -------------------------------------------------- */
  /* 8) RETURN (STABLE SHAPE)                           */
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
      created_at: member.created_at,
    },

    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      // ⚠️ legacy flag (UI hint only)
      is_premium: hasPremiumAccess,
      settings: settings ?? null,
    },

    subscription: safeSubscription,

    access: {
      premium: hasPremiumAccess,
      plan: safeSubscription.plan,
    },
  };
}
