//APP\app\admin\settings\updateSecuritySettings.ts
"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export async function updateSecuritySettings(input: {
  force_2fa: boolean;
  single_session: boolean;
}) {
  const { member } = await getAdminContext();

  if (member.role?.toLowerCase() !== "admin") {
    throw new Error("Unauthorized");
  }

  const supabase = supabaseServerClient();

  await supabase
    .from("org_settings")
    .update({
      force_2fa: input.force_2fa,
      single_session: input.single_session,
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", member.org_id);
}
