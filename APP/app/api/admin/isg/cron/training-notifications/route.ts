// APP/app/api/admin/isg/cron/training-notifications/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseService } from "@/lib/supabase/service";

export async function POST() {
  /* --------------------------------------------------
   * 1️⃣ Build / Next internal çağrıları BLOKLA
   * -------------------------------------------------- */
  const h = headers();

  // Next.js static data / build-time internal fetch koruması
  if (h.get("x-nextjs-data")) {
    return NextResponse.json({ skipped: true });
  }

  // (Opsiyonel ama önerilir)
  // Cron endpoint’i sadece server içinden çağrılsın
  // if (h.get("x-internal-cron") !== "true") {
  //   return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  // }

  console.log("⏰ [CRON] Training Notifications START");

  const supabase = supabaseService;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  /* --------------------------------------------------
   * 2️⃣ Gecikmiş + bu ayki eğitimler
   * -------------------------------------------------- */
  const { data: executions, error } = await supabase
    .from("annual_plan_executions")
    .select("id, organization_id, activity, planned_period")
    .eq("executed", false)
    .or(
      `plan_year.lt.${year},and(plan_year.eq.${year},planned_month.lte.${month})`
    );

  if (error) {
    console.error("❌ [CRON] DB ERROR", error);
    return NextResponse.json({ error: "DB_ERROR" }, { status: 500 });
  }

  console.log("📦 [CRON] executions:", executions?.length ?? 0);

  if (!executions || executions.length === 0) {
    return NextResponse.json({ success: true, created: 0 });
  }

  /* --------------------------------------------------
   * 3️⃣ Bildirim üretimi
   * -------------------------------------------------- */
  let created = 0;

  for (const ex of executions) {
    const title = "📅 Yapılması Gereken İSG Eğitimi";

    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("org_id", ex.organization_id)
      .eq("title", title)
      .ilike("message", `%${ex.activity}%`)
      .maybeSingle();

    if (existing) continue;

    const { error: insertErr } = await supabase
      .from("notifications")
      .insert({
        org_id: ex.organization_id,
        title,
        message: `${ex.activity} (${ex.planned_period}) henüz tamamlanmamıştır.`,
        read: false,
      });

    if (!insertErr) created++;
  }

  console.log(`✅ [CRON] Notifications created: ${created}`);

  return NextResponse.json({ success: true, created });
}
