// APP/app/api/admin/isg/analyze/annual-plan/seed-executions/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

const MONTHS = [
  "ocak","şubat","mart","nisan","mayıs","haziran",
  "temmuz","ağustos","eylül","ekim","kasım","aralık"
];

  export async function POST() {
    console.log("🌱 [SEED] START");

    const supabase = supabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    const orgId = profile?.organization_id;
    if (!orgId) return NextResponse.json({ error: "ORG_NOT_FOUND" }, { status: 400 });

    const { data: plan } = await supabase
      .from("annual_plan_results")
      .select("analysis_result, document_year")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!plan) return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });

    const executions: any[] = [];

    for (const item of plan.analysis_result.items) {
    const months =
      item.months && item.months.length > 0
        ? item.months
        : ["Ocak"];

    for (const m of months) {
      const normalized = m.trim().toLowerCase();
      let idx = MONTHS.indexOf(normalized);

      if (idx === -1) {
        console.warn("⚠️ Ay çözülemedi, Ocak varsayıldı:", m);
        idx = 0;
      }

      executions.push({
        organization_id: orgId,
        plan_year: plan.document_year,
        activity: item.activity,
        planned_period: item.period,
        planned_month: idx + 1,
        executed: false,
      });
    }
  }

  if (executions.length === 0) {
    console.warn("⚠️ Seed sonucu BOŞ");
    return NextResponse.json({ success: true, count: 0 });
  }

  const { error } = await supabase
    .from("annual_plan_executions")
    .insert(executions);

  if (error) {
    console.error("❌ SEED ERROR:", error);
    return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
  }

  console.log("✅ Seeded executions:", executions.length);
  return NextResponse.json({ success: true, count: executions.length });
}
