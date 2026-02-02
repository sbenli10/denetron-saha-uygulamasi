//APP\app\api\dof\manual\create\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.info("[MANUAL_DOF_CREATE] ===== REQUEST START =====");

  try {
    /* ================= CLIENT ================= */
    const supabase = supabaseServerClient();

    /* ================= BODY ================= */
    const body = await req.json();
    console.info("[MANUAL_DOF_CREATE] Body received", body);

    const {
      konu,
      sayi,
      report_date,
      isg_uzmani,
      bildirim_sekli,
    } = body;

    /* ================= VALIDATION ================= */
    if (!konu || !sayi || !report_date || !isg_uzmani || !bildirim_sekli) {
      return NextResponse.json(
        {
          error:
            "Konu, Sayı, Tarih, İSG Uzmanı ve Bildirim Şekli zorunludur",
        },
        { status: 400 }
      );
    }

    /* ================= AUTH ================= */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    /* ================= ORGANIZATION ================= */
    const { data: orgMember, error: orgError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: "Organizasyon bulunamadı" },
        { status: 404 }
      );
    }

    /* ================= INSERT ================= */
    const reportNo = `DOF-MANUAL-${Date.now()}`;

    const { data: dof, error } = await supabase
      .from("dof_reports")
      .insert({
        org_id: orgMember.org_id,
        report_no: reportNo,
        report_date,
        konu,
        sayi,
        isg_uzmani,
        bildirim_sekli,
        status: "open",
        source_type: "manual",
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[MANUAL_DOF_CREATE] Insert error", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.info("[MANUAL_DOF_CREATE] DOF created", {
      dofId: dof.id,
      reportNo: dof.report_no,
    });

    /* ================= SUCCESS ================= */
    return NextResponse.json({ dof });
  } catch (err) {
    console.error("[MANUAL_DOF_CREATE] FATAL", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
