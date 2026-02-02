type Rec = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  impact?: string | null;
  area?: string | null;
  steps?: string[] | null;
};

export default function RecommendationsCard({ items }: { items: Rec[] }) {
  return (
    <div className="rounded-2xl border bg-white/80 p-3 shadow-glass dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mb-2 text-sm font-medium opacity-80">
        AI Önerilen Aksiyonlar
      </div>
      {items.length === 0 && (
        <div className="text-xs text-slate-500">
          Henüz öneri üretilmedi. Veri birikince AI devreye girecek.
        </div>
      )}
      <ul className="space-y-2 text-xs">
        {items.map((r) => (
          <li key={r.id} className="rounded-lg bg-slate-900/60 p-2">
            <div className="font-medium">{r.title ?? "Öneri"}</div>
            {r.area && (
              <div className="text-[11px] text-amber-300">Alan: {r.area}</div>
            )}
            {r.steps && r.steps.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-[11px] text-slate-300">
                {r.steps.slice(0, 3).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
