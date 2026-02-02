//APP\app\api\dof\manual\save-ai-analysis\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServerClient();
    const { dof_id, analysis } = await req.json();

    if (!dof_id || !analysis) {
      return NextResponse.json(
        { error: "dof_id ve analysis zorunludur" },
        { status: 400 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { error } = await supabase
      .from("dof_reports")
      .update({
        ai_report: analysis,
        ai_updated_at: new Date().toISOString(), // opsiyonel ama tavsiye edilir
      })
      .eq("id", dof_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SAVE_AI_ANALYSIS_ERROR]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
