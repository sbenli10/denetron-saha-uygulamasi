"use client";

import WidgetContainer from "./WidgetContainer";
import { cn } from "@/lib/utils";

type HeatmapItem = {
  date: string;
  count: number;
};

export default function HeatmapWidget({ data }: { data: HeatmapItem[] }) {
  const safe = Array.isArray(data) ? data : [];
  const max = Math.max(...safe.map((d) => d.count), 1);

  const total = safe.reduce((a, b) => a + b.count, 0);
  const peak = safe.reduce(
    (p, c) => (c.count > p.count ? c : p),
    safe[0] ?? { date: "-", count: 0 }
  );

  function getColor(count: number) {
    const ratio = count / max;
    if (count === 0) return "bg-muted/20";
    if (ratio < 0.25) return "bg-slate-700/60";
    if (ratio < 0.5) return "bg-slate-500/70";
    if (ratio < 0.75) return "bg-[var(--accent-color)]/60";
    return "bg-[var(--accent-color)]";
  }

  return (
    <WidgetContainer
      title="90 Günlük Aktivite Yoğunluğu"
      description="Gün bazlı denetim işlem hacmi"
      className="hover:shadow-xl"
    >
      {safe.length === 0 ? (
        <div className="mt-4 flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-muted/20 py-12">
          <span className="text-sm text-muted-foreground">
            Aktivite verisi bulunamadı
          </span>
        </div>
      ) : (
        <>
          {/* SUMMARY */}
          <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-muted/30 px-3 py-2">
              <div className="text-muted-foreground">Toplam işlem</div>
              <div className="mt-0.5 font-semibold text-foreground">
                {total}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-muted/30 px-3 py-2">
              <div className="text-muted-foreground">En yoğun gün</div>
              <div className="mt-0.5 font-semibold text-foreground">
                {peak.date} ({peak.count})
              </div>
            </div>
          </div>

          {/* HEATMAP */}
          <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-12">
            {safe.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square rounded-md border border-white/10",
                  "transition-transform hover:scale-[1.08]",
                  getColor(d.count)
                )}
                title={`${d.date} • ${d.count} işlem`}
              />
            ))}
          </div>

          {/* LEGEND */}
          <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Düşük</span>
            <span>Yüksek</span>
          </div>
        </>
      )}
    </WidgetContainer>
  );
}
