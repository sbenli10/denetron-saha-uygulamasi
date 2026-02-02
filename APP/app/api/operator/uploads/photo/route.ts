// APP/app/api/operator/uploads/photo/route.ts

import { NextResponse } from "next/server";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.log("🟢 [UPLOAD] API HIT");

  const supabase = supabaseServiceRoleClient();
  const form = await req.formData();

  const file = form.get("file") as File | null;
  const orgId = form.get("org_id") as string | null;
  const taskId = form.get("task_id") as string | null;
  const submissionId = form.get("submission_id") as string | null;
  const questionId = form.get("question_id") as string | null;

  console.log("📥 [UPLOAD] PARAMS", {
    orgId,
    taskId,
    submissionId,
    questionId,
    fileType: file?.type,
  });

  if (!file || !orgId || !taskId || !submissionId || !questionId) {
    console.error("❌ [UPLOAD] Missing required fields");
    return NextResponse.json(
      { error: "file, org_id, task_id, submission_id, question_id zorunlu" },
      { status: 400 }
    );
  }

  /* ---------- FILE INFO ---------- */
  const isVideo = file.type.startsWith("video/");
  const ext = isVideo ? "webm" : "jpg";

  const storagePath = `org/${orgId}/submissions/${submissionId}/${crypto.randomUUID()}.${ext}`;
  console.log("📦 [UPLOAD] storagePath =", storagePath);

  /* ---------- STORAGE UPLOAD ---------- */
  const { error: uploadError } = await supabase.storage
    .from("inspection-photos")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("❌ [UPLOAD] Storage upload failed", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage
    .from("inspection-photos")
    .getPublicUrl(storagePath);

  const publicUrl = publicData.publicUrl;
  console.log("🌍 [UPLOAD] publicUrl =", publicUrl);

  /* ---------- FILES TABLE ---------- */
  const { data: fileRow, error: fileErr } = await supabase
    .from("files")
    .insert({
      organization_id: orgId,
      submission_id: submissionId,
      question_id: questionId, // 🔥 ANA BAĞ
      url: publicUrl,
      type: isVideo ? "video" : "photo",
      metadata: {
        source: "inspection",
        task_id: taskId,
      },
    })
    .select("id")
    .single();

  if (fileErr || !fileRow) {
    console.error("❌ [UPLOAD] files insert failed", fileErr);

    await supabase.storage
      .from("inspection-photos")
      .remove([storagePath]);

    return NextResponse.json(
      { error: "Dosya kaydedilemedi" },
      { status: 500 }
    );
  }

  console.log("✅ [UPLOAD] FILE SAVED", {
    file_id: fileRow.id,
    question_id: questionId,
  });

  return NextResponse.json({
    file_id: fileRow.id,
    url: publicUrl,
    type: isVideo ? "video" : "photo",
    question_id: questionId,
  });
}
