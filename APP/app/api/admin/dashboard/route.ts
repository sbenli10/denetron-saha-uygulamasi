export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Şimdilik demo veri gönderiyoruz.
    // Daha sonra Supabase bağlarız.
    return NextResponse.json(
      {
        kpis: {
          totalSubmissions: 10,
          analysisRate: 80,
          analyzedSubmissions: 8,
          averageRisk: 42,
        },
        trend: [
          { date: "2025-01-01", count: 2 },
          { date: "2025-01-02", count: 5 },
          { date: "2025-01-03", count: 3 },
        ],
        by_category: [
          { category: "Elektrik", count: 4 },
          { category: "Yangın", count: 3 },
          { category: "Çevre", count: 3 },
        ],
        by_severity: [
          { severity: "Düşük", count: 3 },
          { severity: "Orta", count: 4 },
          { severity: "Yüksek", count: 3 },
        ],
        critical: [
          { id: 1, title: "Trafo Kapısı Açık", risk: 95 },
          { id: 2, title: "Kablo İzolasyonu Yıpranmış", risk: 88 },
        ],
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
