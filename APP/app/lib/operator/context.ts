// APP/app/lib/operator/context.ts
import { redirect } from "next/navigation";
import { supabaseServerClient, supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function getOperatorContext() {
  const supabase = supabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = supabaseServiceRoleClient();

  // 🔥 SADECE OPERATOR/MANAGER
  const { data: members } = await adminClient
    .from("org_members")
    .select("role, org_id, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  const member = members?.[0] ?? null;

  if (!member) {
    redirect("/no-organization");
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: org } = await adminClient
    .from("organizations")
    .select("id, name, settings, is_premium")
    .eq("id", member.org_id)
    .maybeSingle();

  if (!org) {
    redirect("/no-organization");
  }

  return { user, profile, member, org };
}
