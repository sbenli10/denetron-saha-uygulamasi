"use server";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServerClient, supabaseServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

export async function updateSettings(data: any) {
  const { member } = await getAdminContext();
  const supabase = supabaseServerClient();

  const { error } = await supabase
    .from("org_settings")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("org_id", member.org_id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
}

export async function uploadLogo(file: File) {
  const { member } = await getAdminContext();
  const storage = supabaseServiceRoleClient().storage;

  const path = `logos/${member.org_id}/${randomUUID()}.png`;

  const { error } = await storage.from("public").upload(path, file, {
    upsert: true,
  });

  if (error) throw new Error(error.message);

  const { data: urlData } = storage.from("public").getPublicUrl(path);

  return urlData.publicUrl;
}
