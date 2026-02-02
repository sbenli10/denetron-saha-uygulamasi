import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const log = (step: string, data?: unknown) =>
    console.log(`[MANUAL_DOF_DETAIL][${requestId}] ${step}`, data ?? "");

  log("===== REQUEST START =====");

  const supabase = supabaseServerClient();
  log("Supabase client initialized");

  /* ================= QUERY PARAM ================= */
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  log("Query params parsed", { id });

  if (!id) {
    log("Validation failed: id missing");
    return NextResponse.json(
      { error: "id zorunludur" },
      { status: 400 }
    );
  }

  /* ================= AUTH ================= */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    log("Unauthorized request");
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  log("Authenticated user", { userId: user.id });

  /* ================= ORGANIZATION ================= */
  const { data: orgMember, error: orgError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (orgError || !orgMember) {
    log("Organization not found", orgError);
    return NextResponse.json(
      { error: "Organizasyon bulunamadı" },
      { status: 404 }
    );
  }

  log("Organization resolved", { orgId: orgMember.org_id });

  /* ================= QUERY ================= */
  log("Querying dof_reports");

  const { data: dof, error } = await supabase
    .from("dof_reports")
    .select(`
      id,
      org_id,
      report_no,
      report_date,
      konu,
      sayi,
      isg_uzmani,
      bildirim_sekli,
      status,
      created_at,

      items:dof_items (
        id,
        area,
        operator_finding,
        responsible,
        risk_description,
        action_description,
        long_description,
        legislation,
        severity,
        deadline,
        status,

        files:dof_item_files (
          id,
          file:files (
            id,
            url,
            type,
            created_at
          )
        )
      )
    `)
    .eq("id", id)
    .eq("org_id", orgMember.org_id)   // 🔐 KRİTİK KONTROL
    .eq("source_type", "manual")
    .maybeSingle();

  if (error) {
    log("Supabase query ERROR", {
      message: error.message,
      code: error.code,
      details: error.details,
    });

    return NextResponse.json(
      { error: "DÖF okunurken veritabanı hatası oluştu" },
      { status: 500 }
    );
  }

  if (!dof) {
    log("No DÖF found or access denied");
    return NextResponse.json(
      { error: "Manuel DÖF bulunamadı" },
      { status: 404 }
    );
  }

  log("DÖF fetched successfully", {
    dofId: dof.id,
    itemCount: dof.items?.length ?? 0,
  });

  return NextResponse.json({ dof });
}
