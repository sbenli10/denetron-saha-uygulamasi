//APP\app\api\dof\ai-review\route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  console.log("[DOF AI REVIEW] POST request");

  try {
    const supabase = supabaseServerClient();
    const { dof_id } = await req.json();

    console.log("[DOF AI REVIEW] Payload", { dof_id });

    if (!dof_id) {
      return NextResponse.json(
        { error: "dof_id zorunludur" },
        { status: 400 }
      );
    }

    const { data: dof, error } = await supabase
      .from("dof_reports")
      .select(
        `title, description, items:dof_items(risk_description, corrective_action, status)`
      )
      .eq("id", dof_id)
      .single();

    if (error || !dof) {
      console.error("[DOF AI REVIEW] DOF NOT FOUND", error);
      return NextResponse.json(
        { error: "DÖF bulunamadı" },
        { status: 404 }
      );
    }

    console.log("[DOF AI REVIEW] DOF fetched", {
      itemsCount: dof.items?.length ?? 0,
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages: [{ role: "user", content: "..." }],
      temperature: 0.2,
    });

    const decision =
      completion.choices[0]?.message?.content ?? "";

    console.log("[DOF AI REVIEW] AI response received");

    return NextResponse.json({ decision });
  } catch (err) {
    console.error("[DOF AI REVIEW] FATAL", err);
    return NextResponse.json(
      { error: "AI değerlendirme hatası" },
      { status: 500 }
    );
  }
}
