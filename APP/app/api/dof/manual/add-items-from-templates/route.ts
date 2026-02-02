// APP/app/api/dof/manual/add-items-from-templates/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServerClient();
    const { dof_id, template_ids, responsible: responsible_name, due_date } =
      await req.json();

    if (!dof_id || !template_ids?.length) {
      return NextResponse.json(
        { error: "dof_id ve template_ids zorunludur" },
        { status: 400 }
      );
    }

    // 🔒 SUBMITTED GUARD
    const guard = await guardDofNotSubmitted(
      supabase,
      dof_id,
      "Toplu madde ekleme"
    );
    if (guard) return guard;

    // 🔍 DÖF doğrula (manuel mi?)
    const { data: dof } = await supabase
      .from("dof_reports")
      .select("id, source_type")
      .eq("id", dof_id)
      .single();

    if (!dof || dof.source_type !== "manual") {
      return NextResponse.json(
        { error: "Sadece manuel DÖF için kullanılabilir" },
        { status: 400 }
      );
    }

    // 📦 Şablonları çek
    const { data: templates } = await supabase
      .from("risk_templates")
      .select("*")
      .in("id", template_ids);

    if (!templates?.length) {
      return NextResponse.json(
        { error: "Risk şablonları bulunamadı" },
        { status: 404 }
      );
    }

    // 🧩 Maddeleri ekle
    const inserts = templates.map(t => ({
      dof_report_id: dof_id,
      area: t.area,
      equipment: t.equipment,
      risk_description: t.risk_text,
      action_description: t.action_text,
      legislation: t.legislation,
      deadline: due_date,
      responsible: responsible_name,
      status: "open",
    }));

    const { error } = await supabase
      .from("dof_items")
      .insert(inserts);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[MANUAL ADD ITEMS ERROR]", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
