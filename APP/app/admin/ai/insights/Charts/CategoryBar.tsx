"use client";

type Item = { category: string; count: number };

export default function CategoryBar({
  data,
  height = 260,
}: {
  data: Item[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count || 0));

  return (
    <div style={{ height }} className="flex items-end gap-2">
      {data.length === 0 && (
        <div className="text-xs text-slate-500">Veri yok.</div>
      )}
      {data.map((d) => (
        <div key={d.category} className="flex-1 flex flex-col items-center">
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-yellow-300 dark:from-amber-400 dark:to-yellow-200"
            style={{ height: `${(d.count / max) * 100 || 0}%` }}
          />
          <div className="mt-1 text-[11px] text-center text-slate-600 dark:text-slate-300">
            {d.category}
          </div>
        </div>
      ))}
    </div>
  );
}
