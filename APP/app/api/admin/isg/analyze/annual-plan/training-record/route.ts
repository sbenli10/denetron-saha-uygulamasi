import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const log = (step: string, data?: unknown) => {
    console.log(`🧠 [TRAINING_RECORD][${requestId}] ${step}`);
    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
  };

  log("===== REQUEST START =====");

  const { searchParams } = new URL(req.url);
  const executionId = searchParams.get("execution_id");

  log("Query params", { executionId });

  if (!executionId) {
    log("❌ MISSING execution_id");
    return NextResponse.json(
      { error: "MISSING_EXECUTION_ID" },
      { status: 400 }
    );
  }

  const supabase = supabaseServerClient();

  /* ================= EXECUTION ================= */
  log("Fetching annual_plan_executions");

  const { data: execution, error: execErr } = await supabase
    .from("annual_plan_executions")
    .select(`
      id,
      activity,
      planned_period,
      planned_month,
      executed,
      executed_at
    `)
    .eq("id", executionId)
    .single();

  if (execErr) {
    log("❌ EXECUTION QUERY ERROR", execErr);
  } else {
    log("✅ EXECUTION FOUND", execution);
  }

  if (!execution) {
    log("❌ EXECUTION NOT FOUND");
    return NextResponse.json({ execution: null });
  }

  /* ================= TRAINING RECORD ================= */
  log("Fetching training_records");

  const {
    data: record,
    error: recordErr,
  } = await supabase
    .from("training_records")
    .select(`
      id,
      training_type,
      participant_type,
      participant_count,
      trainer_name,
      training_date,
      duration_hours,
      ai_note,
      created_at
    `)
    .eq("execution_id", executionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recordErr) {
    log("❌ TRAINING_RECORD QUERY ERROR", recordErr);
  } else if (!record) {
    log("⚠️ TRAINING_RECORD NOT FOUND (NULL)");
    log("ℹ️ Muhtemel nedenler:", {
      "execution_id": executionId,
      "training_records": "Bu execution için kayıt yok",
    });
  } else {
    log("✅ TRAINING_RECORD FOUND", record);
  }

  /* ================= EVIDENCES ================= */
  log("Fetching annual_plan_evidences");

  const {
    data: evidences,
    error: evErr,
  } = await supabase
    .from("annual_plan_evidences")
    .select("id, file_url, file_type, created_at")
    .eq("execution_id", executionId)
    .order("created_at", { ascending: true });

  if (evErr) {
    log("❌ EVIDENCES QUERY ERROR", evErr);
  } else {
    log("✅ EVIDENCES FOUND", {
      count: evidences?.length ?? 0,
      items: evidences,
    });
  }

  log("===== RESPONSE PAYLOAD =====", {
    execution,
    record: record ?? null,
    evidences: evidences ?? [],
  });

  log("===== REQUEST END =====");

  return NextResponse.json({
    execution,
    record: record ?? null,
    evidences: evidences ?? [],
  });
}
