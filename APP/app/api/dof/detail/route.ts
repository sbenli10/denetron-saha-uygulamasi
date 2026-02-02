// APP/app/api/dof/detail/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  console.log("────────────────────────────────────────");
  console.log("🔍 [DOF DETAIL] REQUEST START");

  const supabase = supabaseServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  console.log("📥 Query param id =", id);

  if (!id) {
    console.warn("⚠️ [DOF DETAIL] Missing id param");
    return NextResponse.json({ error: "id zorunlu" }, { status: 400 });
  }

  const { data: dof, error } = await supabase
    .from("dof_reports")
    .select(`
      id,
      report_no,
      description,
      status,
      created_at,
      items:dof_items (
        id,
        risk_description,
        operator_finding,
        action_description,
        status,
        created_at,
        files:dof_item_files (
          id,
          type,
          file:files (
            id,
            url,
            type,
            created_at
          )
        ),
        ai_analysis:dof_item_ai_analysis (
          risk_level,
          findings,
          recommendation,
          confidence,
          created_at
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !dof) {
    console.error("❌ [DOF DETAIL] DOF not found", error);
    return NextResponse.json({ error: "DÖF bulunamadı" }, { status: 404 });
  }

  console.log("✅ [DOF DETAIL] DOF FOUND =", {
    id: dof.id,
    report_no: dof.report_no,
    status: dof.status,
  });

  (dof.items ?? []).forEach((item: any, i: number) => {
    console.log(`──── ITEM #${i + 1} ────`);
    console.log("🧩 risk =", item.risk_description);
    console.log("📎 file count =", item.files?.length ?? 0);
  });

  console.log("🏁 [DOF DETAIL] REQUEST END");
  console.log("────────────────────────────────────────");

  return NextResponse.json({ dof });
}
