//APP\app\api\dof\create-from-suggestions\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { submission_id, question_ids } = await req.json();

  if (!submission_id || !question_ids?.length) {
    return NextResponse.json(
      { error: "Eksik veri" },
      { status: 400 }
    );
  }

  // 1️⃣ DÖF raporu oluştur
  const { data: dof } = await supabase
    .from("dof_reports")
    .insert({
      submission_id,
      status: "open",
      report_no: `DOF-${Date.now()}`,
    })
    .select()
    .single();

  // 2️⃣ Maddeleri ekle
  await Promise.all(
    question_ids.map((qid: string) =>
      supabase.from("dof_items").insert({
        dof_report_id: dof.id,
        risk_description: qid,
        action_description:
          "Düzeltici faaliyet uygulanacaktır.",
        status: "open",
      })
    )
  );

  return NextResponse.json({ dof_id: dof.id });
}
