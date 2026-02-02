// APP/app/api/dof/manual/add-item/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const log = (step: string, data?: unknown) =>
    console.log(`[MANUAL_ADD_ITEM][${requestId}] ${step}`, data ?? "");

  try {
    log("===== REQUEST START =====");

    const supabase = supabaseServerClient();
    log("Supabase client initialized");

    const body = await req.json();
    log("Body received", body);

    const {
      dof_id,
      area,
      risk_description,
      action_description,
      responsible,
      deadline,
      severity,
      legislation,
      long_description,
    } = body;

    /* ================= VALIDATION ================= */
    if (!dof_id || !area || !risk_description || !deadline) {
      log("Validation failed: missing fields");
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik" },
        { status: 400 }
      );
    }

    /* ================= AUTH ================= */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      log("Unauthorized request");
      return NextResponse.json(
        { error: "Yetkisiz" },
        { status: 401 }
      );
    }

    log("Authenticated user", { userId: user.id });

    /* ================= GUARD ================= */
    const guardResponse = await guardDofNotSubmitted(
      supabase,
      { dofId: dof_id },
      "Madde ekleme"
    );

    if (guardResponse) {
      log("Guard blocked operation");
      return guardResponse;
    }

    /* ================= INSERT ================= */
    const { error } = await supabase.from("dof_items").insert({
      dof_report_id: dof_id,
      area: area?.trim() || null,
      risk_description: risk_description?.trim(),
      action_description:
        action_description?.trim() ||
        "Düzeltici faaliyet belirlenecektir",
      long_description: long_description?.trim() || null,
      responsible: responsible?.trim() || null,

      // ⬇️ ARTIK SERBEST METİN – DATE PARSE YOK
      deadline: deadline?.trim() || null,

      legislation: legislation?.trim() || null,

      // ⬇️ ARTIK SERBEST METİN
      severity: severity?.trim() || null,

      status: "open",
    });


    if (error) {
      log("Insert error", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    log("Item inserted successfully");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[MANUAL_ADD_ITEM][FATAL]", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
