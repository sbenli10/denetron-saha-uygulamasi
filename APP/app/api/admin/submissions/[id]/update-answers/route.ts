import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================= TYPES ================= */

type SubmissionAnswer = {
  questionId: string;
  questionText: string;
  answer: "yes" | "no";
  findingText?: string;
  media?: {
    file_id: string;
    type: "photo" | "video";
  }[];
};

/* ================= ROUTE ================= */

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const submissionId = params.id;
  const supabase = supabaseServerClient();

  console.log("🟦 [UPDATE ANSWERS] submissionId =", submissionId);

  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId zorunlu" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);

  if (!body?.answers || !Array.isArray(body.answers)) {
    return NextResponse.json(
      { error: "answers array zorunlu" },
      { status: 400 }
    );
  }

  const answers: SubmissionAnswer[] = body.answers;

  /* ================= VALIDATION ================= */

  for (const [i, ans] of answers.entries()) {
    if (!ans.questionId || !ans.questionText || !ans.answer) {
      return NextResponse.json(
        { error: `answers[${i}] zorunlu alanlar eksik` },
        { status: 400 }
      );
    }

    if (ans.media?.length) {
      for (const m of ans.media) {
        if (!m.file_id || typeof m.file_id !== "string") {
          console.error(
            "❌ [UPDATE ANSWERS] blob veya geçersiz media tespit edildi",
            m
          );
          return NextResponse.json(
            {
              error:
                "Geçersiz media formatı. Blob gönderilemez.",
            },
            { status: 400 }
          );
        }
      }
    }
  }

  /* ================= UPDATE ================= */

  const { error } = await supabase
    .from("submissions")
    .update({
      data: answers,
    })
    .eq("id", submissionId);

  if (error) {
    console.error("❌ [UPDATE ANSWERS] DB error", error);
    return NextResponse.json(
      { error: "Submission güncellenemedi" },
      { status: 500 }
    );
  }

  console.log(
    "✅ [UPDATE ANSWERS] submission.data updated",
    { submissionId, answerCount: answers.length }
  );

  return NextResponse.json({ success: true });
}
