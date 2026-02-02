// APP/app/admin/cron/page.tsx
export const dynamic = "force-dynamic";

import { loadCronHistoryDetailed } from "../cron-history/loadCronHistoryDetailed";
import CronHistoryExpandable from "app/admin/cron-history/CronHistoryExpandable";

export default async function CronPage() {
  const runs = await loadCronHistoryDetailed();

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

        <CronHistoryExpandable runs={runs} />
      </div>
  );
}
