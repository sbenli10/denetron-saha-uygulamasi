//APP\app\api\dof\add-item\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServerClient();
    const body = await req.json();

    const {
      dof_id,
      area,
      equipment,
      due_date,
      responsible_user_id,
    } = body;

    if (!dof_id || !area || !equipment || !due_date || !responsible_user_id) {
      return NextResponse.json(
        { error: "Eksik alanlar mevcut" },
        { status: 400 }
      );
    }

    // 🔒 SUBMITTED GUARD
    const guard = await guardDofNotSubmitted(
      supabase,
      dof_id,
      "Madde ekleme"
    );
    if (guard) return guard;

    const { data: template } = await supabase
      .from("risk_templates")
      .select("*")
      .eq("area", area)
      .eq("equipment", equipment)
      .single();

    if (!template) {
      return NextResponse.json(
        { error: "Risk şablonu bulunamadı" },
        { status: 404 }
      );
    }

    const { data: item, error } = await supabase
      .from("dof_items")
      .insert({
        dof_report_id: dof_id,
        area,
        equipment,
        risk_description: template.risk_text,
        action_description: template.action_text,
        legislation: template.legislation,
        deadline: due_date,
        responsible: responsible_user_id,
        status: "open",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error("[DOF ADD ITEM ERROR]", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
