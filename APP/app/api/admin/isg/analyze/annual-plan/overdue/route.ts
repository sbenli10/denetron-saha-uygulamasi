//APP\app\api\admin\isg\analyze\annual-plan\overdue\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  console.log("⛔ [OVERDUE] START");

  const supabase = supabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) return NextResponse.json({ overdueCount: 0 });

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  const { data } = await supabase
    .from("annual_plan_executions")
    .select("id")
    .eq("organization_id", orgId)
    .eq("executed", false)
    .or(`plan_year.lt.${y},and(plan_year.eq.${y},planned_month.lt.${m})`);

  return NextResponse.json({
    success: true,
    overdueCount: data?.length || 0,
  });
}
