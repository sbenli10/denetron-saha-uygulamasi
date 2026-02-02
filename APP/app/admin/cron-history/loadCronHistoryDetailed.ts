// APP/app/admin/cron-history/loadCronHistoryDetailed.ts
"use server";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export interface OperatorRunState {
  operator_id: string;
  operator_name: string | null;
  state: "pending" | "submitted" | "completed" | "overdue";
  submitted_at: string | null;
}

export interface CronRunDetailed {
  id: string;
  ran_at: string;
  created_tasks: number;
  template_name: string;
  completion_rate: number;
  operators: OperatorRunState[];
}

export async function loadCronHistoryDetailed(): Promise<CronRunDetailed[]> {
  const { member } = await getAdminContext();
  if (!member) throw new Error("Yetkisiz");

  const db = supabaseServiceRoleClient();

  const { data, error } = await db
    .from("v_cron_run_operator_states")
    .select("*")
    .eq("org_id", member.org_id)
    .order("ran_at", { ascending: false });

  if (error) throw error;

  const grouped = new Map<string, CronRunDetailed>();

  for (const row of data ?? []) {
    if (!grouped.has(row.cron_run_id)) {
      grouped.set(row.cron_run_id, {
        id: row.cron_run_id,
        ran_at: row.ran_at,
        created_tasks: row.created_tasks,
        template_name: row.template_name,
        completion_rate: 0,
        operators: [],
      });
    }

    const run = grouped.get(row.cron_run_id)!;

    run.operators.push({
      operator_id: row.operator_id,
      operator_name: row.operator_name,
      state: row.operator_state,
      submitted_at: row.submitted_at,
    });
  }

  // completion rate hesapla
  for (const run of grouped.values()) {
    const completed = run.operators.filter(o => o.state === "completed").length;
    run.completion_rate = run.operators.length
      ? Math.round((completed / run.operators.length) * 100)
      : 0;
  }

  return Array.from(grouped.values());
}
