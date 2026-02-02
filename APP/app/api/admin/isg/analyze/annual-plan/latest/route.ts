//APP\app\api\admin\isg\analyze\annual-plan\latest\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  console.log("📊 [LATEST] FETCH");

  const supabase = supabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) {
    return NextResponse.json({ summary: null });
  }

  const { data } = await supabase
    .from("annual_plan_results")
    .select("analysis_result")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ summary: null });
  }

  return NextResponse.json({
    summary: data.analysis_result.summary,
  });
}
