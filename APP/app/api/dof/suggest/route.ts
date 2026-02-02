// APP/app/api/dof/suggest/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { openai } from "@/lib/ai/openai";
import { buildDofPrompt } from "@/lib/ai/prompts/dofPrompt";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { submission_id } = await req.json();

  if (!submission_id) {
    return NextResponse.json(
      { error: "submission_id zorunlu" },
      { status: 400 }
    );
  }

  /* ================= SUBMISSION ================= */
  const { data: submission, error } = await supabase
    .from("submissions")
    .select("template_name, severity, data")
    .eq("id", submission_id)
    .single();

  if (error || !submission) {
    return NextResponse.json(
      { error: "Denetim bulunamadı" },
      { status: 404 }
    );
  }

  /* ================= FINDINGS ================= */
  const answers: any[] = submission.data?.answers ?? [];

  const findings = answers
    .filter(a => a.answer === "no" || a.answer === false)
    .map(a => ({
      question: a.questionText ?? "—",
      category: a.category ?? "Genel",
      severity: submission.severity ?? "medium",
    }));

  if (findings.length === 0) {
    return NextResponse.json({
      items: [],
      message: "DÖF gerektiren bulgu bulunamadı",
    });
  }

  /* ================= AI ================= */
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Sen ISO 9001 ve ISO 45001 konusunda uzman bir iş güvenliği denetçisisin.",
      },
      {
        role: "user",
        content: buildDofPrompt({
          templateName: submission.template_name ?? "Denetim",
          findings,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    return NextResponse.json(
      { error: "AI cevap üretmedi" },
      { status: 500 }
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json(
      { error: "AI çıktısı parse edilemedi", raw: content },
      { status: 500 }
    );
  }

  return NextResponse.json(parsed);
}
