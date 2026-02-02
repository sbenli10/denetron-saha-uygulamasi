// APP/app/api/admin/metrics/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Rol & org → profiles
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    console.error("metrics profile error:", profileErr.message);
  }

  if (!profile || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (profile.role !== "admin" && profile.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const org_id = profile.organization_id;

  const { data: submissions } = await supabase
    .from("submissions")
    .select("*, ai_analysis(*)")
    .eq("org_id", org_id);

  if (!submissions) return NextResponse.json({});

  const total = submissions.length;
  const analyzed = submissions.filter((s) => s.ai_analysis !== null).length;

  const riskScores = submissions
    .map((s) => s.ai_analysis?.risk_score)
    .filter((n): n is number => typeof n === "number");

  const avgRisk =
    riskScores.length > 0
      ? riskScores.reduce((a, b) => a + b, 0) / riskScores.length
      : 0;

  return NextResponse.json({
    kpis: {
      totalSubmissions: total,
      analyzedSubmissions: analyzed,
      analysisRate: total ? analyzed / total : 0,
      averageRisk: avgRisk,
    },
    submissions,
  });
}
