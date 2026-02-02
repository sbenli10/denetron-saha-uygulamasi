import { supabaseServerClient } from "@/app/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await supabaseServerClient();

  const submissions = await supabase
    .from("submissions")
    .select("id, created_at");

  const ocrUsage = await supabase
    .from("ocr_logs")
    .select("id, created_at");

  const aiUsage = await supabase
    .from("ai_logs")
    .select("id, created_at");

  return NextResponse.json({
    submissions: submissions.data ?? [],
    ocrUsage: ocrUsage.data ?? [],
    aiUsage: aiUsage.data ?? [],
  });
}
