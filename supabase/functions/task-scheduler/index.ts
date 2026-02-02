//supabase\functions\task-scheduler\index.ts
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { computeNextRun } from "./computeNextRun.ts";

serve(async () => {
  console.log("👉 Edge function started");

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    console.log("❌ Missing env vars");
    return new Response("missing env", { status: 500 });
  }

  const supabase = createClient(url, key);

  const now = new Date().toISOString();

  const { data: schedules, error: schedulesErr } = await supabase
    .from("task_schedules")
    .select("*")
    .lte("next_run_at", now)
    .eq("status", "active");

  if (schedulesErr) {
    console.log("❌ schedule query error:", schedulesErr);
    return new Response("query error", { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    console.log("⚠️ no schedules to run");
    return new Response("no schedules");
  }

  for (const s of schedules) {
    console.log("➡️ Running schedule:", s.id);

    for (const op of s.operator_ids) {
      console.log("   ➕ inserting task for operator:", op);

      const { error: taskErr } = await supabase
        .from("tasks")
        .insert({
          org_id: s.org_id,
          assignee_id: op,
          created_by: s.created_by ?? op,  // operator id fallback
          status: "pending",
          title: "Planlanmış Görev",
          description: "Otomatik oluşturuldu",
          priority: "normal",
          due_date: null,
          template_id: null
        });

      if (taskErr) console.log("   ❌ task insert error:", taskErr);
      else console.log("   ✅ task inserted");
    }

    const next = computeNextRun(s);

    const { error: updateErr } = await supabase
      .from("task_schedules")
      .update({ next_run_at: next })
      .eq("id", s.id);

    if (updateErr) console.log("❌ update error:", updateErr);
    else console.log("✅ schedule updated");
  }

  console.log("🎉 DONE");
  return new Response("ok");
});
