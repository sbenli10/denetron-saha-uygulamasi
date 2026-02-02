// APP/app/api/operator/assigned-tasks/[id]/complete/route.ts

import { NextResponse } from "next/server";
import {
  supabaseServerClient,
  supabaseServiceRoleClient,
} from "@/lib/supabase/server";

/* ================= TYPES ================= */

type IncomingAnswer = {
  questionId: string;
  questionText?: string;
  answer: "yes" | "no";
  findingText?: string | null;
  media?: {
    file_id: string;
    type: "photo" | "video";
  }[];
};

/* ================= HELPERS ================= */

function normalizeAnswers(answers: IncomingAnswer[]) {
  return answers.map(a => ({
    questionId: a.questionId,
    questionText: a.questionText ?? null,
    answer: a.answer,
    findingText: a.findingText ?? null,
    media: a.media ?? [],
  }));
}


/* ================= ROUTE ================= */

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  console.log("🟢 [COMPLETE] API HIT");
  console.log("🆔 [COMPLETE] taskId =", params.id);

  const taskId = params.id;
  const auth = supabaseServerClient();
  const db = supabaseServiceRoleClient();

  /* ---------- BODY ---------- */
  let body: any;
  try {
    body = await req.json();
    console.log(
      "📥 [COMPLETE] RAW BODY =",
      JSON.stringify(body, null, 2)
    );
  } catch (err) {
    console.error("❌ [COMPLETE] BODY PARSE FAILED", err);
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { answers, description } = body;

  if (!Array.isArray(answers)) {
    console.error("❌ [COMPLETE] answers is not array");
    return NextResponse.json(
      { error: "`answers` must be array" },
      { status: 400 }
    );
  }

  /* ---------- AUTH ---------- */
  const {
    data: { user },
    error: authErr,
  } = await auth.auth.getUser();

  if (authErr || !user) {
    console.error("❌ [COMPLETE] AUTH FAILED", authErr);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("👤 [COMPLETE] USER =", user.id);

  /* ---------- SEVERITY ---------- */
  const severity = answers.some(
    (a: IncomingAnswer) => a.answer === "no"
  )
    ? "critical"
    : "low";

  console.log("⚠️ [COMPLETE] SEVERITY =", severity);

  /* ---------- NORMALIZE ---------- */
 const normalizedAnswers = normalizeAnswers(answers);

  console.log(
    "🧼 [COMPLETE] NORMALIZED ANSWERS =",
    JSON.stringify(normalizedAnswers, null, 2)
  );

  /* ---------- RPC CALL ---------- */
  console.log("🚀 [COMPLETE] CALLING RPC complete_assigned_task");

  const { data, error } = await db.rpc("complete_assigned_task", {
    p_task_id: taskId,
    p_user_id: user.id,
    p_answers: normalizedAnswers,
    p_description: description ?? null,
    p_severity: severity,
  });

  if (error) {
    console.error("❌ [COMPLETE] RPC FAILED", error);
    return NextResponse.json(
      { error: "Submission tamamlanamadı" },
      { status: 500 }
    );
  }

  console.log("✅ [COMPLETE] TRANSACTION SUCCESS");
  console.log("🧾 [COMPLETE] submissionId =", data);

  return NextResponse.json({
    success: true,
    submissionId: data,
  });
}
