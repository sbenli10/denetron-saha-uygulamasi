"use client";

type Item = { level: "low" | "mid" | "high" | "critical"; count: number };

export default function SeverityDonut({
  data,
  height = 220,
}: {
  data: Item[];
  height?: number;
}) {
  const total = data.reduce((a, c) => a + (c.count || 0), 0) || 1;

  const mapColor: Record<Item["level"], string> = {
    low: "bg-emerald-400",
    mid: "bg-yellow-400",
    high: "bg-orange-400",
    critical: "bg-red-500",
  };

  return (
    <div style={{ height }} className="flex items-center gap-3">
      <div className="relative h-32 w-32 rounded-full bg-slate-900/40 flex items-center justify-center">
        {data.map((s) => {
          const pct = ((s.count || 0) / total) * 100;
          return (
            <div
              key={s.level}
              className={`absolute rounded-full ${mapColor[s.level]} opacity-70`}
              style={{
                inset: `${50 - pct / 4}%`,
              }}
            />
          );
        })}
        <div className="relative text-xs text-slate-100 text-center">
          Toplam
          <div className="text-lg font-semibold">{total}</div>
        </div>
      </div>
      <div className="space-y-1 text-xs">
        {data.map((s) => (
          <div key={s.level} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${mapColor[s.level]}`} />
            <span className="capitalize">{s.level}</span>
            <span className="ml-auto text-slate-500">
              {s.count} ({(((s.count || 0) / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
