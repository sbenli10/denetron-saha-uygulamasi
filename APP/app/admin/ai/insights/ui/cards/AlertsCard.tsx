type Alert = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  severity?: string | null;
  scope?: string | null;
  note?: string | null;
};

export default function AlertsCard({ items }: { items: Alert[] }) {
  return (
    <div className="rounded-2xl border bg-white/80 p-3 shadow-glass dark:border-slate-800 dark:bg-slate-950/60">
      <div className="mb-2 text-sm font-medium opacity-80">Son Uyarılar</div>
      {items.length === 0 && (
        <div className="text-xs text-slate-500">Aktif uyarı yok.</div>
      )}
      <ul className="space-y-2 text-xs">
        {items.map((a) => (
          <li key={a.id} className="rounded-lg bg-slate-900/60 p-2">
            <div className="flex justify-between">
              <span className="font-medium">{a.title ?? "Uyarı"}</span>
              {a.severity && (
                <span className="text-[10px] uppercase text-amber-300">
                  {a.severity}
                </span>
              )}
            </div>
            {a.note && (
              <div className="mt-1 text-[11px] text-slate-300 truncate">
                {a.note}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
