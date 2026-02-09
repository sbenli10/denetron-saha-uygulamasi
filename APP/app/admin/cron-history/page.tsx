export const dynamic = "force-dynamic";

import { loadCronHistoryDetailed } from "../cron-history/loadCronHistoryDetailed";
import { loadNextSchedules } from "../cron-history/loadNextSchedules";
import CronHistoryExpandable from "app/admin/cron-history/CronHistoryExpandable";

function formatTR(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR");
  } catch {
    return iso;
  }
}

export default async function CronPage() {
  const runs = await loadCronHistoryDetailed();
  const next = await loadNextSchedules();

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          Otomatik Denetimler
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Zamanlanmış denetimlerin operatör bazlı durumunu görüntüleyin.
        </p>
      </div>

      {/* NEXT RUNS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="font-semibold text-slate-900 mb-3">
          Yaklaşan Çalışmalar
        </div>

        {next.length === 0 ? (
          <div className="text-sm text-slate-500">Aktif zamanlama yok.</div>
        ) : (
          <div className="space-y-2">
            {next.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {s.template_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    Sonraki: {formatTR(s.next_run_at)} • {s.timezone} • {s.run_time}
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  {s.frequency} / {s.interval}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CronHistoryExpandable runs={runs} />
    </div>
  );
}
