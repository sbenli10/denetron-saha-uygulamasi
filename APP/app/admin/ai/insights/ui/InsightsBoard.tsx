// APP/app/admin/ai/insights/ui/InsightsBoard.tsx
"use client";

import { useMemo, useState } from "react";
import { RotateCw, Info } from "lucide-react";

import Filters, { type FiltersState } from "./Filters";
import Kpis from "./Kpis";
import CategoryBar from "../Charts/CategoryBar";
import SeverityDonut from "../Charts/SeverityDonut";
import TrendLine from "../Charts/TrendLine";
import AlertsCard from "./cards/AlertsCard";
import RecommendationsCard from "./cards/RecommendationsCard";
import AnomaliesCard from "./cards/AnomaliesCard";
import PredictionsCard from "./cards/PredictionsCard";
import Empty from "./Empty";

/* ---------- Types ---------- */

type Submission = {
  id: string;
  created_at: string;
  template_name: string | null;
  location: string | null;
  ai_analysis: {
    category?: string | null;
    severity?: string | null;
    risk_score?: number | null;
    title?: string | null;
    note?: string | null;
  } | null;
};

type KpiStats = {
  total: number;
  aiProcessed: number;
  critical: number;
  avgScore: number | null;
};

type CategoryAgg = { category: string; count: number };
type SeverityAgg = { level: "low" | "mid" | "high" | "critical"; count: number };
type TrendPoint = { date: string; count: number };

type TableRow = {
  id: string;
  date: string;
  template: string | null;
  location: string | null;
  category: string | null;
  severity: string;
  title: string | null;
};

/* ---------- Küçük yardımcı bileşen ---------- */

function IInfo({ text }: { text: string }) {
  return (
    <span
      className="ml-1 inline-flex items-center text-[10px] text-neutral-400"
      title={text}
    >
      <Info className="h-3 w-3" />
    </span>
  );
}

/* ---------- Ana bileşen ---------- */

export default function InsightsBoard({
  submissions,
}: {
  submissions: Submission[];
}) {
  const [filters, setFilters] = useState<FiltersState | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // filtreleri resetlemek için

  const onApply = (f: FiltersState) => {
    setFilters(f);
  };

  /* ---------- Filtrelenmiş kayıtlar ---------- */

  const filtered = useMemo(() => {
    let list = [...submissions];
    const f = filters;

    if (!f) return list;

    if (f.from) {
      const from = new Date(f.from);
      list = list.filter((s) => new Date(s.created_at) >= from);
    }

    if (f.to) {
      const to = new Date(f.to);
      list = list.filter((s) => new Date(s.created_at) <= to);
    }

    if (f.severity && f.severity !== "all") {
      list = list.filter(
        (s) =>
          (s.ai_analysis?.severity ?? "").toLowerCase() ===
          String(f.severity).toLowerCase()
      );
    }

    if (f.q) {
      const q = f.q.toLowerCase();
      list = list.filter((s) => {
        const a = s.ai_analysis;
        return (
          (s.template_name ?? "").toLowerCase().includes(q) ||
          (s.location ?? "").toLowerCase().includes(q) ||
          (a?.category ?? "").toLowerCase().includes(q) ||
          (a?.title ?? "").toLowerCase().includes(q) ||
          (a?.note ?? "").toLowerCase().includes(q)
        );
      });
    }

    // İstersen scope/scoped için extra filtre ekleyebilirsin

    return list;
  }, [submissions, filters]);

  const hasAny = filtered.length > 0;

  /* ---------- KPI hesapları ---------- */

  const kpis: KpiStats = useMemo(() => {
    const total = filtered.length;
    const withAi = filtered.filter((s) => !!s.ai_analysis).length;
    const critical = filtered.filter(
      (s) => (s.ai_analysis?.severity ?? "").toLowerCase() === "critical"
    ).length;

    const scores = filtered
      .map((s) => s.ai_analysis?.risk_score)
      .filter((n): n is number => typeof n === "number");

    const avgScore =
      scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

    return { total, aiProcessed: withAi, critical, avgScore };
  }, [filtered]);

  /* ---------- Aggregations ---------- */

  const byCategory: CategoryAgg[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      const cat =
        (s.ai_analysis?.category || "Diğer").toString().trim() || "Diğer";
      map.set(cat, (map.get(cat) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([category, count]) => ({
      category,
      count,
    }));
  }, [filtered]);

  const bySeverity: SeverityAgg[] = useMemo(() => {
    const levels: SeverityAgg["level"][] = [
      "critical",
      "high",
      "mid",
      "low",
    ] as any; // TS için küçük hack

    const map = new Map<string, number>();
    for (const s of filtered) {
      const sev =
        (s.ai_analysis?.severity || "unknown").toString().toLowerCase();
      map.set(sev, (map.get(sev) ?? 0) + 1);
    }
    return levels.map((lvl) => ({
      level: lvl,
      count: map.get(lvl) ?? 0,
    }));
  }, [filtered]);

  const trend: TrendPoint[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      const d = new Date(s.created_at);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, count]) => ({ date, count }));
  }, [filtered]);

  const table: TableRow[] = useMemo(
    () =>
      filtered.map((s) => ({
        id: s.id,
        date: new Date(s.created_at).toLocaleDateString("tr-TR"),
        template: s.template_name,
        location: s.location,
        category: s.ai_analysis?.category ?? null,
        severity: (s.ai_analysis?.severity ?? "unknown").toString(),
        title: s.ai_analysis?.title ?? null,
      })),
    [filtered]
  );

  const lastUpdated =
    filtered.length > 0
      ? filtered
          .map((s) => s.created_at)
          .sort()
          .slice(-1)[0]
      : null;

  /* ---------- Render ---------- */

  return (
    <div className="space-y-3">
      {/* Filtreler */}
      <Filters
        key={refreshKey}
        onApply={onApply}
        initialScope={{ type: "org", id: null }}
      />

      {/* Aksiyonlar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => {
            setFilters(null);
            setRefreshKey((k) => k + 1);
          }}
          className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
          title="Filtreleri sıfırla"
        >
          <RotateCw className="h-4 w-4" /> Yenile
        </button>
      </div>

      {/* KPI kartları */}
      <Kpis kpis={kpis} lastUpdated={lastUpdated} dense />

      {!hasAny ? (
        <Empty />
      ) : (
        <div className="grid gap-3 lg:grid-cols-12">
          {/* Sol içerik */}
          <div className="space-y-3 lg:col-span-8">
            <div className="rounded-2xl border bg-white/80 p-3 shadow-glass dark:border-neutral-800 dark:bg-neutral-950/60">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium opacity-80">
                  Kategoriye Göre Dağılım{" "}
                  <IInfo text="Seçili aralıkta AI bulgularının kategori kırılımı." />
                </div>
                <span className="text-[11px] text-neutral-500">
                  {lastUpdated
                    ? `Son kayıt: ${new Date(
                        lastUpdated
                      ).toLocaleDateString("tr-TR")}`
                    : ""}
                </span>
              </div>
              <CategoryBar data={byCategory} height={420} />
            </div>

            <div className="rounded-2xl border bg-white/80 p-3 shadow-glass dark:border-neutral-800 dark:bg-neutral-950/60">
              <div className="mb-2 text-sm font-medium opacity-80">
                Zamana Göre Bulgu Trendi{" "}
                <IInfo text="Günlük bazda gönderim / bulgu sayısı." />
              </div>
              <TrendLine data={trend} height={360} />
            </div>

            {/* Tabloyu ileride kullanırsan:
                <FindingsTable rows={table} />
             */}
          </div>

          {/* Sağ panel */}
          <aside className="space-y-3 self-start lg:col-span-4 lg:sticky lg:top-20">
            <div className="rounded-2xl border bg-white/80 p-3 shadow-glass dark:border-neutral-800 dark:bg-neutral-950/60">
              <div className="mb-2 text-sm font-medium opacity-80">
                Şiddet Dağılımı{" "}
                <IInfo text="Bulgu şiddeti: critical / high / mid / low oranları." />
              </div>
              <SeverityDonut data={bySeverity} height={280} />
            </div>

            {/* Backend tarafı hazır olunca bu kartlara gerçek data bağlayacağız */}
            <AlertsCard items={[]} />
            <RecommendationsCard items={[]} />
            <AnomaliesCard items={[]} />
            <PredictionsCard items={[]} />
          </aside>
        </div>
      )}
    </div>
  );
}
