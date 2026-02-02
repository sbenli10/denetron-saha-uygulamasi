//APP\app\admin\roles\[id]\actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin/context";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function updateRole(id: string, formData: FormData) {
  const rawName = formData.get("name") as string;
  const name = rawName?.trim();
  const permissions = formData.getAll("permissions") as string[];

  if (!id) {
    throw new Error("Geçersiz rol ID'si.");
  }

  if (!name || name.length < 2) {
    throw new Error("Rol adı geçersiz.");
  }

  const { member } = await getAdminContext();
  const supabase = supabaseServerClient();

  const { error } = await supabase
    .from("roles")
    .update({
      name,
      permissions: permissions.length ? permissions : [],
      org_id: member.org_id,
    })
    .eq("id", id)
    .eq("org_id", member.org_id);

  if (error) {
    console.error("UpdateRole Error:", error);
    throw new Error("Rol güncellenemedi.");
  }

  revalidatePath("/admin/roles");
  redirect("/admin/roles?updated=1");
}
