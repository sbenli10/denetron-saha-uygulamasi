"use client";

type KPIs = {
  total: number;
  aiProcessed: number;
  critical: number;
  avgScore: number | null;
};

export default function Kpis({
  kpis,
  lastUpdated,
  dense,
}: {
  kpis: KPIs;
  lastUpdated: string | null;
  dense?: boolean;
}) {
  const cls =
    "rounded-2xl border bg-white/80 shadow-glass dark:border-slate-800 dark:bg-slate-950/70";

  return (
    <div className={`grid gap-3 ${dense ? "md:grid-cols-4" : "md:grid-cols-2"}`}>
      <div className={cls + " p-3"}>
        <div className="text-[11px] text-slate-500">Toplam Gönderim</div>
        <div className="mt-1 text-xl font-semibold">{kpis.total}</div>
      </div>
      <div className={cls + " p-3"}>
        <div className="text-[11px] text-slate-500">AI Analiz Edilen</div>
        <div className="mt-1 text-xl font-semibold">{kpis.aiProcessed}</div>
      </div>
      <div className={cls + " p-3"}>
        <div className="text-[11px] text-slate-500">Kritik Bulgular</div>
        <div className="mt-1 text-xl font-semibold text-red-500">
          {kpis.critical}
        </div>
      </div>
      <div className={cls + " p-3"}>
        <div className="text-[11px] text-slate-500">Ortalama Risk Skoru</div>
        <div className="mt-1 text-xl font-semibold">
          {kpis.avgScore != null ? kpis.avgScore.toFixed(1) : "-"}
        </div>
        {lastUpdated && (
          <div className="mt-1 text-[10px] text-slate-500">
            Son veri: {new Date(lastUpdated).toLocaleDateString("tr-TR")}
          </div>
        )}
      </div>
    </div>
  );
}
