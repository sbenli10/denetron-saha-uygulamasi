// APP/app/admin/cron-history/load.ts
"use server";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export interface CronHistoryRow {
  id: string;
  ran_at: string;
  created_tasks: number;
  status: "success" | "failed" | "skipped";
  error: string | null;
  template_name: string;
}

export async function loadCronHistory(): Promise<CronHistoryRow[]> {
  const { member } = await getAdminContext();
  if (!member) throw new Error("Yetkisiz");

  const db = supabaseServiceRoleClient();

  const { data, error } = await db
    .from("v_cron_runs")
    .select(`
      id,
      ran_at,
      created_tasks,
      status,
      error,
      template_name
    `)
    .eq("org_id", member.org_id)
    .order("ran_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return data ?? [];
}
