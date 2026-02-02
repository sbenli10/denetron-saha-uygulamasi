//APP\app\admin\settings\updateIntegrations.ts
"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export async function updateIntegrations(input: {
  ibys_enabled: boolean;
  ibys_env: "test" | "prod";
  ibys_org_code: string;
}) {
  const { member } = await getAdminContext();

  if (member.role?.toLowerCase() !== "admin") {
    throw new Error("Unauthorized");
  }

  const supabase = supabaseServerClient();

  /* MVP: şimdilik org_settings meta alanı gibi davranıyoruz */
  await supabase
    .from("org_settings")
    .update({
      updated_at: new Date().toISOString(),
      /* ileriye dönük: jsonb integrations kolonu */
    })
    .eq("org_id", member.org_id);
}
