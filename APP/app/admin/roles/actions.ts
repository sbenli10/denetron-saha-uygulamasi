"use server";

import { revalidateTag } from "next/cache";
import { getAdminContext } from "@/lib/admin/context";
import { supabaseServerClient, supabaseServiceRoleClient } from "@/lib/supabase/server";

/* ---------------------------
   CREATE ROLE
---------------------------- */
export async function createRole(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();

  const { member, org } = await getAdminContext();

  // Service Role client → RLS bypass
  const supabase = supabaseServiceRoleClient();

  if (name.toLowerCase() === "manager" && !org?.is_premium) {
    throw new Error("Manager rolü sadece Premium paketlerde kullanılabilir.");
  }

  const { error } = await supabase.from("roles").insert({
    name,
    org_id: member.org_id,
    permissions: [],
  });

  if (error) throw new Error("Rol oluşturulamadı: " + error.message);

  revalidateTag("roles");
  return { success: true };
}

/* ---------------------------
   UPDATE ROLE
---------------------------- */
export async function updateRole(id: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const permissions = formData.getAll("permissions") as string[];

  if (!id) throw new Error("Rol ID eksik.");
  if (!name) throw new Error("Rol adı zorunludur.");

  const { member } = await getAdminContext();
  const supabase = supabaseServerClient();

  const { error } = await supabase
    .from("roles")
    .update({
      name,
      permissions: permissions ?? [],
    })
    .eq("id", id)
    .eq("org_id", member.org_id);

  if (error) throw new Error("Güncelleme hatası: " + error.message);

  revalidateTag("roles");
  return { success: true };
}

/* ---------------------------
   DELETE ROLE
---------------------------- */
export async function deleteRole(id: string) {
  console.log("DELETE ACTION TRIGGERED:", id);

  const { member } = await getAdminContext();
  const supabase = supabaseServiceRoleClient(); // <-- CRITICAL FIX

  // 1) Rolü doğrula
  const { data: existing, error: fetchError } = await supabase
    .from("roles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    console.log("Fetch error:", fetchError);
    throw new Error("Rol okunamadı: " + fetchError.message);
  }

  if (!existing) {
    throw new Error("Rol bulunamadı.");
  }

  // 2) Kullanıcı bağlı mı?
  const { count } = await supabase
    .from("org_members")
    .select("id", { count: "exact", head: true })
    .eq("role_id", id)
    .eq("org_id", member.org_id);

  if (count && count > 0) {
    throw new Error("Bu role bağlı kullanıcılar var. Rol silinemez.");
  }

  // 3) Gerçek silme
  const { error: deleteError } = await supabase
    .from("roles")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.log("Delete error:", deleteError);
    throw new Error("Silinemedi: " + deleteError.message);
  }

  console.log("Role physically deleted from DB.");

  revalidateTag("roles");
  return { ok: true };
}