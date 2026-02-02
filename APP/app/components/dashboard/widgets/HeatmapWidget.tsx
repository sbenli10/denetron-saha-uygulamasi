// app/components/dashboard/widgets/HeatmapWidget.tsx
"use client";

import WidgetContainer from "./WidgetContainer";

export default function HeatmapWidget({ data }: { data: { date: string; count: number }[] }) {
  const safe = Array.isArray(data) ? data : [];
  const max = Math.max(...safe.map((d) => d.count), 1);

  function getColor(count: number) {
    const r = count / max;
    if (count === 0) return "bg-muted/20";
    if (r < 0.25) return "bg-slate-700";
    if (r < 0.5) return "bg-slate-500";
    if (r < 0.75) return "bg-[var(--accent-color)]/60";
    return "bg-[var(--accent-color)]";
  }

  return (
    <WidgetContainer
      title="90 Günlük Aktivite"
      description="Son 90 günlük işlem yoğunluğu"
      className="hover:shadow-xl"
    >
      {safe.length === 0 ? (
        <div className="mt-3 flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-muted/20 py-10">
          <span className="text-sm text-muted-foreground">Heatmap verisi bulunamadı</span>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-10 gap-1 sm:grid-cols-12">
            {safe.map((d, i) => (
              <div
                key={i}
                className={[
                  "aspect-square rounded-md border border-white/10 transition-transform hover:scale-[1.05]",
                  getColor(d.count),
                ].join(" ")}
                title={`${d.date} — ${d.count}`}
              />
            ))}
          </div>

          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground">
            <span>Az</span>
            <span>Çok</span>
          </div>
        </>
      )}
    </WidgetContainer>
  );
}
