// APP/app/api/admin/isg/analyze/annual-plan/actions/route.ts

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { ACTION_TEMPLATES } from "@/lib/isg/action-templates";

/* ---------------------------------------------------
   Yardımcı: Due date hesaplama
--------------------------------------------------- */
function resolveDueDate(rule: string, year: number): string {
  if (rule === "end_of_january") return `${year}-01-31`;

  if (rule === "within_30_days") {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  }

  return `${year}-12-31`;
}

/* ---------------------------------------------------
   Yardımcı: Kritik bulgu → aksiyon eşleştirme
--------------------------------------------------- */
function matchActionTemplates(criticalFindings: string[]) {
  return ACTION_TEMPLATES.filter(template =>
    criticalFindings.some(finding =>
      template.finding_pattern.some(pattern =>
        finding.toLowerCase().includes(pattern.toLowerCase())
      )
    )
  );
}

/* ===================================================
   POST – AKSİYON PLANI OLUŞTUR
=================================================== */
export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const body = await req.json();

  /**
   * Beklenen body:
   * {
   *   analysisResultId: string
   * }
   */

  /* ---------- AUTH ---------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  /* ---------- ANALYSIS RESULT ---------- */
  const { data: analysis, error: analysisErr } = await supabase
    .from("annual_plan_results")
    .select("id, org_id, document_year, analysis_result")
    .eq("id", body.analysisResultId)
    .single();

  if (analysisErr || !analysis) {
    return NextResponse.json(
      { error: "Analysis result not found" },
      { status: 404 }
    );
  }

  const year = analysis.document_year;
  const criticalFindings =
    analysis.analysis_result?.summary?.criticalFindings ?? [];

  if (!criticalFindings.length) {
    return NextResponse.json(
      { error: "No critical findings to create actions" },
      { status: 400 }
    );
  }

  /* ---------- MATCH ACTION TEMPLATES ---------- */
  const matchedTemplates = matchActionTemplates(criticalFindings);

  if (!matchedTemplates.length) {
    return NextResponse.json(
      { error: "No action templates matched" },
      { status: 400 }
    );
  }

  /* ---------- CREATE DOF REPORT ---------- */
  const { data: report, error: reportErr } = await supabase
    .from("dof_reports")
    .insert({
      org_id: analysis.org_id,
      source_type: "annual_plan",
      status: "open",
      konu: `${year} Yılı İSG Planı Revizyon Aksiyonları`,
      ai_summary:
        "Yıllık İSG planı denetçi analizi sonucunda sistem tarafından oluşturulan aksiyon planıdır.",
      created_by: user.id,
    })
    .select()
    .single();

  if (reportErr || !report) {
    return NextResponse.json(
      { error: "Failed to create action report" },
      { status: 500 }
    );
  }

  /* ---------- CREATE DOF ITEMS ---------- */
  for (const tpl of matchedTemplates) {
    const a = tpl.action_template;

    await supabase.from("dof_items").insert({
      dof_report_id: report.id,
      risk_description: tpl.finding_key,
      action_description: a.action,
      legislation: a.legalBasis ?? null,
      responsible: a.responsible,
      deadline: resolveDueDate(a.dueDateRule, year),
      severity: tpl.severity,
      status: "open",
      operator_finding: "Bu aksiyon sistem tarafından önerilmiştir.",
    });
  }

  return NextResponse.json({
    success: true,
    report_id: report.id,
    created_actions: matchedTemplates.length,
  });
}

/* ===================================================
   PATCH – AKSİYON TAMAMLANDI
=================================================== */
export async function PATCH(req: Request) {
  const supabase = supabaseServerClient();
  const body = await req.json();

  /**
   * body:
   * {
   *   dofItemId: string
   * }
   */

  const { error } = await supabase
    .from("dof_items")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", body.dofItemId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update action" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
