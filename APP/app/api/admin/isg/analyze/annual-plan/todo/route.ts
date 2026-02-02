// APP/app/api/admin/isg/analyze/annual-plan/todo/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  console.log("📅 [TODO] GET START");

  const supabase = supabaseServerClient();

  /* ---------- AUTH ---------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("⛔ [TODO] Unauthorized");
    return NextResponse.json(
      {
        items: [],
        meta: {
          reason: "NO_PLAN",
          message: "Yetkisiz erişim",
        },
      },
      { status: 401 }
    );
  }

  /* ---------- ORG ---------- */
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile?.organization_id) {
    console.warn("⚠️ [TODO] Organization not found");
    return NextResponse.json({
      items: [],
      meta: {
        reason: "NO_PLAN",
        message: "Organizasyon bulunamadı",
      },
    });
  }

  const orgId = profile.organization_id;

  /* ---------- DATE ---------- */
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  console.log("📆 [TODO] Year / Month:", year, month);
  console.log("🏢 [TODO] Org:", orgId);

 /* ---------- FETCH EXECUTIONS (CRON UYUMLU) ---------- */
   const { data: executions, error } = await supabase
    .from("annual_plan_executions")
    .select(`
      id,
      activity,
      planned_period,
      planned_month,
      plan_year,
      executed
    `)
    .eq("organization_id", orgId)
    .order("plan_year", { ascending: true })
    .order("planned_month", { ascending: true });
  if (error) {
    console.error("❌ [TODO] DB ERROR:", error);
    return NextResponse.json({
      items: [],
      meta: {
        reason: "NO_PLAN",
        message: "Eğitim görevleri alınamadı",
      },
    });
  }

  console.log("✅ [TODO] Item count:", executions?.length ?? 0);

  /* ---------- NO ITEMS ---------- */
  if (!executions || executions.length === 0) {
    return NextResponse.json({
      items: [],
      meta: {
        reason: "OK",
        message: "Bu ay için planlanmış eğitim bulunmamaktadır",
      },
    });
  }

  /* ---------- SUCCESS ---------- */
  return NextResponse.json({
    items: executions,
    meta: {
      reason: "OK",
    },
  });
}

/* ---------- PREVENT 405 / JSON ERRORS ---------- */
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
