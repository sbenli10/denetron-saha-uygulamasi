// APP/app/api/operator/submissions/[id]/update-answers/route.ts
import { NextResponse } from "next/server";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const submissionId = params.id;
  const supabase = supabaseServiceRoleClient();

  console.log("🟦 [UPDATE ANSWERS] submissionId =", submissionId);

  const body = await req.json();
  const { answers } = body;

  if (!Array.isArray(answers)) {
    return NextResponse.json(
      { error: "answers array zorunlu" },
      { status: 400 }
    );
  }

  // 🔒 VALIDATION: blob kesinlikle yasak
  for (const a of answers) {
    for (const m of a.media ?? []) {
      if ("blob" in m) {
        console.error("❌ Blob detected in update-answers", m);
        return NextResponse.json(
          { error: "blob forbidden in answers" },
          { status: 400 }
        );
      }
    }
  }

  // 🔁 TRANSACTION
  const { error } = await supabase.rpc("update_submission_answers", {
    p_submission_id: submissionId,
    p_answers: answers,
  });

  if (error) {
    console.error("❌ [UPDATE ANSWERS] FAILED", error);
    return NextResponse.json(
      { error: "answers update failed" },
      { status: 500 }
    );
  }

  console.log("✅ [UPDATE ANSWERS] SUCCESS");
  return NextResponse.json({ success: true });
}
