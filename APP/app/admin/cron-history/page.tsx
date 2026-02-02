// APP/app/admin/cron-history/page.tsx
export const dynamic = "force-dynamic";

import { loadCronHistory } from "./load";
export default async function CronHistoryPage() {
  const rows = await loadCronHistory();

  return (
 
      <div className="max-w-6xl mx-auto py-12 space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Otomatik Görev Geçmişi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Zamanlanmış görevlerin cron tarafından ne zaman ve nasıl çalıştığını görüntüleyin.
          </p>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 text-left font-medium text-slate-600">
                  Çalışma Zamanı
                </th>
                <th className="px-5 py-3 text-left font-medium text-slate-600">
                  Şablon
                </th>
                <th className="px-5 py-3 text-center font-medium text-slate-600">
                  Oluşan Görev
                </th>
                <th className="px-5 py-3 text-left font-medium text-slate-600">
                  Durum
                </th>
              </tr>
            </thead>

            <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-slate-100 hover:bg-slate-50 transition"
              >
                {/* TIME */}
                <td className="px-5 py-4 text-slate-700">
                  {new Date(r.ran_at).toLocaleString("tr-TR")}
                </td>

                {/* TEMPLATE */}
                <td className="px-5 py-4 font-medium text-slate-800">
                  {r.template_name}
                </td>

                {/* COUNT */}
                <td className="px-5 py-4 text-center">
                  <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100">
                    {r.created_tasks}
                  </span>
                </td>

                {/* STATUS */}
                <td className="px-5 py-4">
                  {r.status === "success" && (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      Başarılı
                    </span>
                  )}

                  {r.status === "skipped" && (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                      Yeni görev oluşturulmadı
                    </span>
                  )}

                  {r.status === "failed" && (
                    <div className="space-y-1">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Hata
                      </span>
                      {r.error && (
                        <div className="text-xs text-red-500 max-w-sm">
                          {r.error}
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-slate-400">
                  Henüz cron çalıştırılmamış.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
  );
}
