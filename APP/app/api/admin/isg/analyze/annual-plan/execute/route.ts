// APP/app/api/admin/isg/analyze/annual-plan/execute/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.log("📎 [EXECUTE] START");

  const supabase = supabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn("⛔ EXECUTE UNAUTHORIZED");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const executionId = form.get("execution_id") as string;
  const files = form.getAll("file") as File[];

  console.log("📎 executionId:", executionId);
  console.log("📎 files count:", files.length);

  if (!executionId) {
    return NextResponse.json({ error: "MISSING_EXECUTION_ID" }, { status: 400 });
  }

  // Dosya yoksa sadece tamamlandı say
  for (const file of files) {
    const path = `annual-plan/${executionId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("evidences")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("❌ UPLOAD FAIL", uploadError);
      return NextResponse.json({ error: "UPLOAD_FAIL" }, { status: 500 });
    }

    await supabase.from("annual_plan_evidences").insert({
      execution_id: executionId,
      file_url: path,
      file_type: file.type,
    });
  }

  const { error: updateErr } = await supabase
    .from("annual_plan_executions")
    .update({
      executed: true,
      executed_at: new Date().toISOString(),
    })
    .eq("id", executionId);

  if (updateErr) {
    console.error("❌ EXECUTION UPDATE FAIL", updateErr);
    return NextResponse.json({ error: "EXECUTE_FAIL" }, { status: 500 });
  }

  console.log("✅ EXECUTION CLOSED:", executionId);

  return NextResponse.json({ success: true });
}
