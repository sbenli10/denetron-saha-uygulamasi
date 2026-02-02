//APP\app\api\admin\isg\analyze\annual-plan\complete-training\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const log = (step: string, data?: unknown) =>
    console.log(`[TRAINING_COMPLETE][${requestId}] ${step}`, data ?? "");

  log("===== REQUEST START =====");

  const supabase = supabaseServerClient();

  /* ================= AUTH ================= */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    log("Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  log("Authenticated user", { userId: user.id });

  /* ================= FORM DATA ================= */
  const form = await req.formData();

  const executionId = form.get("execution_id") as string;
  const trainingType = form.get("training_type") as string | null;
  const participantType = form.get("participant_type") as string | null;
  const participantCount = form.get("participant_count")
    ? Number(form.get("participant_count"))
    : null;
  const trainerName = form.get("trainer_name") as string | null;
  const trainingDate = form.get("training_date") as string | null;
  const durationHours = form.get("duration_hours")
    ? Number(form.get("duration_hours"))
    : null;
  const aiNote = form.get("ai_note") as string | null;

  const files = form.getAll("files") as File[];

  log("Form parsed", {
    executionId,
    trainingType,
    participantType,
    participantCount,
    trainingDate,
    durationHours,
    filesCount: files.length,
  });

  if (!executionId) {
    return NextResponse.json(
      { error: "MISSING_EXECUTION_ID" },
      { status: 400 }
    );
  }

  /* ================= ORG ================= */
  const { data: orgMember, error: orgError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (orgError || !orgMember) {
    log("Organization not found");
    return NextResponse.json(
      { error: "ORG_NOT_FOUND" },
      { status: 404 }
    );
  }

  log("Organization resolved", { orgId: orgMember.org_id });

  /* ================= EXECUTION CHECK ================= */
  const { data: execution, error: execError } = await supabase
    .from("annual_plan_executions")
    .select("id, executed")
    .eq("id", executionId)
    .eq("organization_id", orgMember.org_id)
    .single();

  if (execError || !execution) {
    log("Execution not found");
    return NextResponse.json(
      { error: "EXECUTION_NOT_FOUND" },
      { status: 404 }
    );
  }

  if (execution.executed) {
    log("Execution already completed");
    return NextResponse.json(
      { error: "ALREADY_COMPLETED" },
      { status: 400 }
    );
  }

  /* ================= TRAINING RECORD ================= */
  const { error: recordError } = await supabase
    .from("training_records")
    .insert({
      execution_id: executionId,
      org_id: orgMember.org_id,

      training_type: trainingType,
      participant_type: participantType,
      participant_count: participantCount,
      trainer_name: trainerName,

      training_date: trainingDate,
      duration_hours: durationHours,

      ai_note: aiNote,
      created_by: user.id,
    });

  if (recordError) {
    log("Training record insert error", recordError);
    return NextResponse.json(
      { error: recordError.message },
      { status: 400 }
    );
  }

  log("Training record created");

  /* ================= FILE UPLOAD ================= */
  for (const file of files) {
    const path = `annual-plan/${executionId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("evidences")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      log("File upload failed", uploadError);
      return NextResponse.json(
        { error: "UPLOAD_FAILED" },
        { status: 500 }
      );
    }

    await supabase.from("annual_plan_evidences").insert({
      execution_id: executionId,
      file_url: path,
      file_type: file.type,
    });
  }

  log("Files uploaded and evidences saved");

  /* ================= MARK EXECUTED ================= */
  const { error: updateError } = await supabase
    .from("annual_plan_executions")
    .update({
      executed: true,
      executed_at: new Date().toISOString(),
    })
    .eq("id", executionId);

  if (updateError) {
    log("Execution update failed", updateError);
    return NextResponse.json(
      { error: "EXECUTION_UPDATE_FAILED" },
      { status: 500 }
    );
  }

  log("Execution marked as completed");

  log("===== REQUEST END =====");

  return NextResponse.json({ success: true });
}
