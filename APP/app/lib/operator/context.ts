// APP/app/lib/operator/context.ts
import { redirect } from "next/navigation";
import { supabaseServerClient, supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function getOperatorContext() {
  const supabase = supabaseServerClient();

  // 1) Kullanıcı giriş yapmış mı?
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 2) Üyelik ve rol kontrolü service role ile yapılır
  const adminClient = supabaseServiceRoleClient();

  const { data: members } = await adminClient
    .from("org_members")
    .select("role, org_id, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const member = members?.[0] ?? null;

  if (!member) redirect("/login");

  // Admin → operator paneline giremez
  if (member.role === "admin") {
    redirect("/admin/dashboard");
  }

  // 3) Profil bilgisi
  const { data: profile } = await adminClient
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // 4) Organizasyon bilgisi (Layout için zorunlu)
  const { data: org } = await adminClient
    .from("organizations")
    .select("id, name, settings, is_premium")
    .eq("id", member.org_id)
    .maybeSingle();


  if (!org) redirect("/login");

  return { user, profile, member, org };
}
