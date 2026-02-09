// supabase/functions/task-scheduler/index.ts
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { DateTime } from "https://esm.sh/luxon@3.4.3";
import { computeNextRun } from "./computeNextRun.ts";

type ScheduleRow = {
  id: string;
  org_id: string;
  template_id: string | null;
  operator_ids: string[] | null;

  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  day_of_week: number | null;
  day_of_month: number | null;

  timezone: string;
  run_time: string;
  next_run_at: string;
  status: "active" | "paused";

  created_by: string | null;

  due_policy?: "hours" | "days";
  due_value?: number;

  locked_at: string | null;
  lock_token: string | null; // ✅ new column
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function safeComputeNextRun(args: Parameters<typeof computeNextRun>[0]) {
  try {
    const next = computeNextRun(args);
    if (!next) throw new Error("computeNextRun returned empty value");
    return next;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`computeNextRun failed: ${msg}`);
  }
}

function validateRunTime(runTime: string) {
  // HH:mm or HH:mm:ss
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(runTime);
  if (!match) return false;

  const hh = Number(match[1]);
  const mm = Number(match[2]);
  const ss = match[3] ? Number(match[3]) : 0;

  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59 && ss >= 0 && ss <= 59;
}

serve(async (req: Request) => {
  const startedAt = Date.now();

  try {
    // 0) HTTP hardening
    if (req.method !== "POST") {
      return json({ error: "Method Not Allowed" }, 405);
    }

    // Optional secret
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
      const provided = req.headers.get("x-cron-secret");
      if (!provided || provided !== cronSecret) {
        return json({ error: "Unauthorized" }, 401);
      }
    }

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      console.log("❌ Missing env vars");
      return json({ error: "missing env" }, 500);
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    // UTC now for DB comparisons
    const nowUtc = DateTime.now().setZone("UTC");
    const nowIso = nowUtc.toISO()!;

    // 1) LOCK TTL
    const lockTtlMinutes = 15;
    const lockExpiredBefore = nowUtc.minus({ minutes: lockTtlMinutes }).toISO()!;

    // ✅ Claim token for this run
    const lockToken =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;


    // 2) LOCK + SELECT (claim ownership with lock_token)
    const { data: lockedSchedules, error: lockErr } = await supabase
      .from("task_schedules")
      .update({
        locked_at: nowIso,
        lock_token: lockToken,
      })
      .lte("next_run_at", nowIso)
      .eq("status", "active")
      .or(`locked_at.is.null,locked_at.lt.${lockExpiredBefore}`)
      .select(
        [
          "id",
          "org_id",
          "template_id",
          "operator_ids",
          "frequency",
          "interval",
          "day_of_week",
          "day_of_month",
          "timezone",
          "run_time",
          "next_run_at",
          "status",
          "created_by",
          "due_policy",
          "due_value",
          "locked_at",
          "lock_token",
        ].join(","),
      );

    if (lockErr) {
      console.log("❌ lock/update error:", lockErr);
      return json({ error: "lock error" }, 500);
    }

    const schedules = (lockedSchedules ?? []) as ScheduleRow[];

    // ✅ Ownership filter (no timestamptz string equality)
    const actuallyLocked = schedules.filter((s) => s.lock_token === lockToken);

    // ✅ actuallyLocked.length === 0 check
    if (actuallyLocked.length === 0) {
      console.log("⚠️ no schedules to run");
      return json(
        { ok: true, locked: 0, ran: 0, failed: 0, totalCreated: 0, message: "no schedules" },
        200,
      );
    }

    // Metrics semantics
    const lockedCount = actuallyLocked.length;
    let successCount = 0;
    let failedCount = 0;
    let totalCreated = 0;

    for (const s of actuallyLocked) {
      console.log("➡️ Running schedule:", s.id);

      // 3) cron_runs insert
      const { data: runRow, error: runErr } = await supabase
        .from("cron_runs")
        .insert({
          org_id: s.org_id,
          schedule_id: s.id,
          ran_at: nowIso,
          created_tasks: 0,
          status: "running",
          error: null,
        })
        .select("id")
        .single();

      if (runErr || !runRow?.id) {
        console.log("❌ cron_runs insert failed:", runErr);

        // unlock + clear token
        await supabase
          .from("task_schedules")
          .update({ locked_at: null, lock_token: null })
          .eq("id", s.id);

        failedCount += 1;
        continue;
      }

      const cronRunId = runRow.id as string;

      // ✅ run_time validation AFTER cronRunId exists
      if (!validateRunTime(s.run_time)) {
        const msg = `Invalid run_time format: ${s.run_time}`;
        console.log("❌", msg);

        await supabase
          .from("task_schedules")
          .update({
            locked_at: null,
            lock_token: null,
            status: "paused",
            // optional safety: push forward
            next_run_at: nowUtc.plus({ days: 1 }).toISO(),
          })
          .eq("id", s.id);

        await supabase
          .from("cron_runs")
          .update({
            status: "failed",
            error: msg,
            created_tasks: 0,
          })
          .eq("id", cronRunId);

        failedCount += 1;
        continue;
      }

      let createdCount = 0;

      try {
        const operatorIds = Array.isArray(s.operator_ids) ? s.operator_ids : [];
        if (operatorIds.length === 0) {
          console.log("⚠️ schedule has no operators:", s.id);
        }

        // 4) Task upsert (idempotent)
        for (const op of operatorIds) {
          const payload = {
            org_id: s.org_id,
            assignee_id: op,
            created_by: s.created_by ?? op,
            status: "pending",
            title: "Planlanmış Görev",
            description: "Otomatik oluşturuldu",
            priority: "normal",
            due_date: null,
            template_id: s.template_id ?? null,
            schedule_id: s.id,
            cron_run_id: cronRunId,
          };

          const { data: upserted, error: taskErr } = await supabase
            .from("tasks")
            .upsert(payload, {
              onConflict: "cron_run_id,assignee_id",
              ignoreDuplicates: true,
            })
            .select("id");

          if (taskErr) {
            console.log("   ❌ task upsert error:", taskErr);
          } else {
            createdCount += upserted?.length ?? 0;
          }
        }

        // 5) Next run (safe)
        const next = safeComputeNextRun({
          frequency: s.frequency,
          interval: s.interval,
          timezone: s.timezone,
          base_next_run_at: s.next_run_at,
          run_time: s.run_time,
          day_of_week: s.day_of_week ?? undefined,
          day_of_month: s.day_of_month ?? undefined,
        });

        // 6) schedule update + unlock
        const { error: updateErr } = await supabase
          .from("task_schedules")
          .update({
            next_run_at: next,
            locked_at: null,
            lock_token: null,
            status: "active", // ✅ keep active on success
            // optional: last run info (tablon var)
            last_run_at: nowIso,
            last_cron_run_id: cronRunId,
          })
          .eq("id", s.id);

        if (updateErr) {
          console.log("❌ schedule update error:", updateErr);
          throw updateErr;
        }

        // 7) cron_runs finalize
        await supabase
          .from("cron_runs")
          .update({
            created_tasks: createdCount,
            status: "success",
            error: null,
          })
          .eq("id", cronRunId);

        totalCreated += createdCount;
        successCount += 1;

        console.log("✅ schedule done", {
          scheduleId: s.id,
          createdCount,
          next,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log("❌ schedule run failed:", msg);

        const shouldPause =
          typeof msg === "string" &&
          (msg.includes("computeNextRun failed") ||
            msg.includes("Invalid") ||
            msg.includes("timezone") ||
            msg.includes("day_of_week") ||
            msg.includes("day_of_month"));

        // unlock + (optional) pause + clear token
        await supabase
          .from("task_schedules")
          .update({
            locked_at: null,
            lock_token: null,
            ...(shouldPause ? { status: "paused" as const } : {}),
          })
          .eq("id", s.id);

        await supabase
          .from("cron_runs")
          .update({
            status: "failed",
            error: msg,
            created_tasks: createdCount,
          })
          .eq("id", cronRunId);

        failedCount += 1;
      }
    }

    console.log("🎉 DONE", {
      locked: lockedCount,
      success: successCount,
      failed: failedCount,
      totalCreated,
      ms: Date.now() - startedAt,
    });

    return json(
      {
        ok: true,
        locked: lockedCount,     // schedules claimed by this run
        ran: successCount,       // schedules successfully processed
        failed: failedCount,     // schedules failed
        totalCreated,
      },
      200,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[TASK-SCHEDULER ERROR]", msg);
    return json({ error: "Internal Server Error", detail: msg }, 500);
  }
});
