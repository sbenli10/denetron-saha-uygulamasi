//APP\app\api\admin\isg\analyze\annual-plan\evidences\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  console.log("📎 [EVIDENCES] START");

  const supabase = supabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("annual_plan_evidences")
    .select(`
      id,
      file_url,
      file_type,
      created_at,
      execution:annual_plan_executions (
        id,
        activity,
        planned_month,
        plan_year,
        executed
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ EVIDENCE DB", error);
    return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ success: true, items: data });
}
