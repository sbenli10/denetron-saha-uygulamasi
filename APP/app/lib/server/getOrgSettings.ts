import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export async function getOrgSettings() {
  const { member } = await getAdminContext();
  const supabase = supabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("org_settings")
    .select("*")
    .eq("org_id", member.org_id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
