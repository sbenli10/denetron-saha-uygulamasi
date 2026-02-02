// APP/app/post-auth-redirect/page.tsx
import { supabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type RoleJoin = {
  name: string;
} | null;

export default async function PostAuthRedirect() {
  const supabase = supabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // JOIN sonucu roller (array veya single olabilir)
  const { data: member } = await supabase
    .from("org_members")
    .select("role_id, org_id, roles(name)")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!member) redirect("/no-organization");

  // ---- SAFE NORMALIZATION ----
  let rawRole: RoleJoin = null;

  if (Array.isArray(member.roles)) {
    rawRole = member.roles[0] ?? null;           // roles[] formatı
  } else {
    rawRole = member.roles ?? null;              // roles {} formatı
  }

  const roleName = rawRole?.name?.toLowerCase() ?? "operator";
  console.log("[post-auth] role=", roleName);


  // ---- YÖNLENDİRME ----
  if (roleName === "admin" || roleName === "manager") {
    redirect("/admin/dashboard");
  }

  if (roleName === "operator") {
    redirect("/operator/tasks");
  }

  if (roleName === "viewer") {
    redirect("/operator/view");
  }

  redirect("/operator");
}
