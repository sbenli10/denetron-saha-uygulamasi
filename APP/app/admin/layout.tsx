//APP\app\admin\layout.tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import ShellLayout from "@/components/layout/admin/shell/ShellLayout";
import {
  supabaseServerClient,
  supabaseServiceRoleClient,
} from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = supabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = supabaseServiceRoleClient();

  const { data: member } = await admin
    .from("org_members")
    .select("role, role_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!member) redirect("/login");

  let finalRole = member.role ?? null;

  if (member.role_id) {
    const { data: roleRow } = await admin
      .from("roles")
      .select("name")
      .eq("id", member.role_id)
      .maybeSingle();

    finalRole = roleRow?.name ?? member.role;
  }

  if (!["admin", "manager"].includes(finalRole?.toLowerCase() ?? "")) {
    redirect("/operator");
  }

  // ✅ SADECE BURADA UI SHELL
  return <ShellLayout>{children}</ShellLayout>;
}
