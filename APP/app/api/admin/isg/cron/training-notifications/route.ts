// APP/app/api/admin/isg/cron/training-notifications/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseService } from "@/lib/supabase/service";

/**
 * PROFESYONEL İSG EĞİTİM BİLDİRİM SİSTEMİ
 * Bu route, yıllık planlardaki gecikmiş veya vadesi gelmiş eğitimleri tarar
 * ve ilgili organizasyonlar için bildirim üretir.
 */
export async function POST() {
  const h = headers();

  // 1. GÜVENLİK KONTROLLERİ
  // Build-time internal fetch veya yetkisiz dış çağrı koruması
  if (h.get("x-nextjs-data")) return NextResponse.json({ skipped: true });

  console.info("⏰ [CRON] Training Notifications Process Started");

  const supabase = supabaseService;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    // 2. VERİ ÇEKME (Gecikmiş + Bu ayki tamamlanmamış eğitimler)
    const { data: executions, error: fetchError } = await supabase
      .from("annual_plan_executions")
      .select("id, organization_id, activity, planned_period")
      .eq("executed", false)
      .or(
        `plan_year.lt.${year},and(plan_year.eq.${year},planned_month.lte.${month})`
      );

    if (fetchError) {
      console.error("❌ [CRON] Database Fetch Error:", fetchError);
      return NextResponse.json({ error: "DB_FETCH_FAILED" }, { status: 500 });
    }

    if (!executions || executions.length === 0) {
      console.info("ℹ️ [CRON] No pending executions found for this period.");
      return NextResponse.json({ success: true, created: 0 });
    }

    console.info(`📦 [CRON] Processing ${executions.length} potential notifications...`);

    // 3. BİLDİRİM ÜRETİM MANTIĞI
    let createdCount = 0;

    for (const ex of executions) {
      const notificationTitle = "📅 Yapılması Gereken İSG Eğitimi";
      const notificationMessage = `${ex.activity} (${ex.planned_period}) henüz tamamlanmamıştır.`;

      /**
       * ❗ KRİTİK DÜZELTME: 
       * Sadece 'OKUNMAMIŞ' (read: false) olan mevcut bildirimleri kontrol et.
       * Eğer kullanıcı eski bildirimi okuduysa, sistem yeni bir hatırlatıcı oluşturabilmeli.
       */
      const { data: existingNotification } = await supabase
        .from("notifications")
        .select("id")
        .eq("org_id", ex.organization_id)
        .eq("title", notificationTitle)
        .eq("read", false) // ✅ Kilidi açan kritik filtre
        .ilike("message", `%${ex.activity}%`)
        .maybeSingle();

      // Eğer hali hazırda okunmamış bir hatırlatma varsa, mükerrer oluşturma
      if (existingNotification) {
        continue;
      }

      // 4. TEKİL KAYIT İŞLEMİ
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          org_id: ex.organization_id,
          user_id: null, // Global organizasyon bildirimi
          title: notificationTitle,
          message: notificationMessage,
          read: false,
          created_at: new Date().toISOString()
        });

      if (!insertError) {
        createdCount++;
      } else {
        console.warn(`⚠️ [CRON] Failed to create notification for Org: ${ex.organization_id}`, insertError);
      }
    }

    console.info(`✅ [CRON] Process completed. Notifications created: ${createdCount}`);
    
    return NextResponse.json({ 
      success: true, 
      created: createdCount,
      processed: executions.length 
    });

  } catch (err) {
    console.error("🔥 [CRON] Fatal Error:", err);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}