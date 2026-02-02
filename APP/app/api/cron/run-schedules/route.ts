//APP\app\api\cron\run-schedules\route.ts
import { NextResponse } from "next/server";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { computeNextRun } from "@/lib/cron/computeNextRun";

export async function POST() {
  const db = supabaseServiceRoleClient();
  const now = new Date().toISOString();

  try {
    const { data: schedules, error } = await db.rpc("lock_and_get_due_schedules");
    if (error) throw error;

    if (!schedules?.length) {
      return NextResponse.json({ success: true, schedulesRun: 0, createdTasks: 0 });
    }

    let totalCreatedTasks = 0;

    for (const s of schedules) {
      let created = 0;

      try {
        const { data, error } = await db.rpc(
          "create_assigned_tasks_for_schedule",
          { p_schedule_id: s.id }
        );

        if (error) throw error;

        created = data ?? 0;
        totalCreatedTasks += created;

        const nextRun = computeNextRun({
          frequency: s.frequency,
          interval: s.interval,
          timezone: s.timezone,
          day_of_week: s.day_of_week,
          day_of_month: s.day_of_month,
        });

        await db
          .from("task_schedules")
          .update({ next_run_at: nextRun, locked_at: null })
          .eq("id", s.id);

        await db.from("cron_runs").insert({
          schedule_id: s.id,
          org_id: s.org_id,
          ran_at: now,
          created_tasks: created,
          status: created === 0 ? "skipped" : "success",
        });

      } catch (err: any) {
        await db.from("cron_runs").insert({
          schedule_id: s.id,
          org_id: s.org_id,
          ran_at: now,
          created_tasks: 0,
          status: "failed",
          error: String(err?.message ?? err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      schedulesRun: schedules.length,
      createdTasks: totalCreatedTasks,
    });
  } catch (err) {
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}

