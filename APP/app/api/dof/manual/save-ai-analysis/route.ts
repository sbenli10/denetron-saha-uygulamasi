// APP/app/api/dof/manual/save-ai-analysis/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  dof_id?: string;
  analysis?: string;
};

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  console.log(`[SAVE_AI][${reqId}] start`);

  try {
    const supabase = supabaseServerClient();

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
    }

    const dof_id = body?.dof_id?.trim();
    const analysis = body?.analysis?.trim();

    if (!dof_id || !analysis) {
      return NextResponse.json(
        { error: "dof_id ve analysis zorunludur" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) {
      console.error(`[SAVE_AI][${reqId}] auth_error`, userErr);
    }
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { error } = await supabase
      .from("dof_reports")
      .update({
        ai_report: analysis,
        ai_updated_at: new Date().toISOString(),
      })
      .eq("id", dof_id);

    if (error) {
      console.error(`[SAVE_AI][${reqId}] db_error`, error);

      // PostgREST schema cache / kolon yok
      if (error.code === "PGRST204") {
        return NextResponse.json(
          {
            error:
              "DB şeması eksik: dof_reports.ai_report kolonu bulunamadı. Migration çalıştırın ve PostgREST schema cache yenileyin.",
            details: error.message,
          },
          { status: 500 }
        );
      }

      // RLS / yetki hataları (mesaj değişebilir)
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("row-level security") || msg.includes("permission denied")) {
        return NextResponse.json(
          {
            error:
              "Yetki hatası (RLS). dof_reports için UPDATE policy gerekiyor veya endpoint service-role ile çalışmalı.",
            details: error.message,
          },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[SAVE_AI][${reqId}] success dof_id=${dof_id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[SAVE_AI][${reqId}] fatal`, err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
