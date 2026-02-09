// APP/app/admin/cron-history/loadNextSchedules.ts
"use server";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export interface NextScheduleRow {
  id: string;
  template_id: string;
  template_name: string;
  frequency: string;
  interval: number;
  next_run_at: string;
  timezone: string;
  run_time: string;
  status: string;
}

export async function loadNextSchedules(): Promise<NextScheduleRow[]> {
  const { member } = await getAdminContext();
  if (!member) throw new Error("Yetkisiz");

  const db = supabaseServiceRoleClient();

  // template_name için templates join lazım.
  // En basit yol: task_schedules + templates join
  const { data, error } = await db
    .from("task_schedules")
    .select(`
      id,
      template_id,
      frequency,
      interval,
      next_run_at,
      timezone,
      run_time,
      status,
      templates:templates ( name )
    `)
    .eq("org_id", member.org_id)
    .eq("status", "active")
    .order("next_run_at", { ascending: true })
    .limit(10);

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    id: r.id,
    template_id: r.template_id,
    template_name: r.templates?.name ?? "—",
    frequency: r.frequency,
    interval: r.interval,
    next_run_at: r.next_run_at,
    timezone: r.timezone,
    run_time: r.run_time,
    status: r.status,
  }));
}
