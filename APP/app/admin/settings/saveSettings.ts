//APP\app\admin\settings\saveSettings.ts
"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { OrgSettings } from "./types";

export async function saveSettings(settings: OrgSettings) {
  const { member } = await getAdminContext();
  const supabase = supabaseServerClient();

  const { error } = await supabase
    .from("org_settings")
    .update(settings)
    .eq("org_id", member.org_id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
