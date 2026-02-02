type Anomaly = { id: string; created_at: string; score: number | null; location: string | null };

export default function AnomaliesCard({ items }: { items: Anomaly[] }) {
  return (
    <div className="rounded-2xl border bg-white/80 p-3 shadow-glass dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mb-2 text-sm font-medium opacity-80">Anomali Tespiti</div>
      {items.length === 0 && (
        <div className="text-xs text-slate-500">
          AI şu anda olağandışı bir durum görmüyor.
        </div>
      )}
      <ul className="space-y-2 text-xs">
        {items.map((a) => (
          <li key={a.id} className="rounded-lg bg-slate-900/60 p-2">
            <div className="flex justify-between">
              <span>{a.location ?? "Genel"}</span>
              {a.score != null && (
                <span className="text-[11px] text-amber-300">
                  Skor: {a.score.toFixed(2)}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {new Date(a.created_at).toLocaleString("tr-TR")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
