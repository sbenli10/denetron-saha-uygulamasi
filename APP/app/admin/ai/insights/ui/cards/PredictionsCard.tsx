type Prediction = {
  scope: "location" | "org" | "template";
  scoped: string;
  risk: number;
  meta?: any;
};

export default function PredictionsCard({ items }: { items: Prediction[] }) {
  return (
    <div className="rounded-2xl border bg-white/80 p-3 shadow-glass dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mb-2 text-sm font-medium opacity-80">
        Yaklaşan Risk Tahminleri
      </div>
      <ul className="space-y-2 text-xs">
        {items.map((p, i) => (
          <li key={i} className="rounded-lg bg-slate-900/60 p-2">
            <div className="flex justify-between">
              <span>
                {p.scope.toUpperCase()} • {p.scoped}
              </span>
              <span className="text-[11px] text-amber-300">
                Risk: {(p.risk * 100).toFixed(0)}%
              </span>
            </div>
            {p.meta?.reason && (
              <div className="mt-1 text-[11px] text-slate-300 line-clamp-2">
                {p.meta.reason}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
