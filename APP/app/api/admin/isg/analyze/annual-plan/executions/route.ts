//APP\app\api\admin\isg\analyze\annual-plan\executions\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  console.log("📈 [EXECUTIONS] FETCH START");

  const supabase = supabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn("⛔ [EXECUTIONS] Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ORG RESOLUTION (tek doğru yöntem)
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = profile?.organization_id;
    if (!orgId) throw new Error("ORG_ID_NOT_FOUND");

    console.log("🏢 [EXECUTIONS] Org:", orgId);

    const { data, error } = await supabase
      .from("annual_plan_executions")
      .select(`
        id,
        activity,
        planned_period,
        planned_month,
        plan_year,
        executed,
        executed_at
      `)
      .eq("organization_id", orgId)
      .order("plan_year", { ascending: true })
      .order("planned_month", { ascending: true });

    if (error) {
      console.error("❌ [EXECUTIONS] DB ERROR:", error);
      return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
    }

    console.log("✅ [EXECUTIONS] Count:", data.length);

    return NextResponse.json({
      success: true,
      items: data,
    });
  } catch (err: any) {
    console.error("🔥 [EXECUTIONS] ERROR:", err.message);
    return NextResponse.json(
      { error: "EXECUTIONS_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
