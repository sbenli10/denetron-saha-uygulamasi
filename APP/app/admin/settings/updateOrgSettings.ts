"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export async function updateOrgSettings(input: {
  org_name: string;
  language: string;
  timezone: string;
  logo_url: string | null;
}) {
  console.log("[ORG SETTINGS] update started:", input);

  const { member } = await getAdminContext();
  const supabase = supabaseServerClient();

  const { error: settingsErr } = await supabase
    .from("org_settings")
    .update({
      language: input.language,
      timezone: input.timezone,
      logo_url: input.logo_url,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", member.org_id);

  if (settingsErr) {
    console.error("[ORG SETTINGS] org_settings update error:", settingsErr);
    throw settingsErr;
  }

  const { error: orgErr } = await supabase
    .from("organizations")
    .update({ name: input.org_name })
    .eq("id", member.org_id);

  if (orgErr) {
    console.error("[ORG SETTINGS] organizations update error:", orgErr);
    throw orgErr;
  }

  console.log("[ORG SETTINGS] SUCCESS for org:", member.org_id);
}
