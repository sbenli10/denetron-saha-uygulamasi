//APP\app\api\dof\submit\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServerClient();
    const { dof_id } = await req.json();

    if (!dof_id) {
      return NextResponse.json(
        { error: "dof_id zorunludur" },
        { status: 400 }
      );
    }

    const { data: dof } = await supabase
      .from("dof_reports")
      .select("id, status")
      .eq("id", dof_id)
      .single();

    if (!dof || dof.status !== "open") {
      return NextResponse.json(
        { error: "Sadece açık DÖF gönderilebilir" },
        { status: 400 }
      );
    }

    const { data: items } = await supabase
      .from("dof_items")
      .select("status")
      .eq("dof_report_id", dof_id);

    if (!items || items.some((i) => i.status !== "completed")) {
      return NextResponse.json(
        {
          error:
            "Tüm maddeler tamamlanmadan resmi gönderim yapılamaz",
        },
        { status: 400 }
      );
    }

    await supabase
      .from("dof_reports")
      .update({ status: "submitted" })
      .eq("id", dof_id);

    await supabase.from("audit_logs").insert({
      action: "DOF_SUBMITTED",
      metadata: { dof_id },
    });

    return NextResponse.json({
      success: true,
      status: "submitted",
    });
  } catch (err) {
    console.error("[DOF SUBMIT ERROR]", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
