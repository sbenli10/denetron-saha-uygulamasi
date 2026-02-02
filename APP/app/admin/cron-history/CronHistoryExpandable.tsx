//APP\app\admin\cron-history\CronHistoryExpandable.tsx
"use client";

import { useState } from "react";

/* ----------------------------------
   OPERATOR STATE BADGE
---------------------------------- */
function OperatorBadge({ state }: { state: OperatorState }) {
  const styles: Record<OperatorState, string> = {
    completed: "bg-emerald-100 text-emerald-700",
    submitted: "bg-indigo-100 text-indigo-700",
    pending: "bg-slate-100 text-slate-600",
    overdue: "bg-red-100 text-red-700",
  };

  const labels: Record<OperatorState, string> = {
    completed: "Tamamlandı",
    submitted: "Gönderildi",
    pending: "Bekliyor",
    overdue: "Süresi Geçti",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${styles[state]}`}
    >
      {labels[state]}
    </span>
  );
}

/* ----------------------------------
   TYPES
---------------------------------- */
type OperatorState = "pending" | "submitted" | "completed" | "overdue";

interface OperatorRow {
  operator_id: string;
  operator_name: string | null;
  state: OperatorState;
  submitted_at: string | null;
}

interface CronRunRow {
  id: string;
  ran_at: string;
  template_name: string;
  completion_rate: number;
  operators: OperatorRow[];
}

/* ----------------------------------
   MAIN COMPONENT
---------------------------------- */
export default function CronHistoryExpandable({
  runs = [],
}: {
  runs?: CronRunRow[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!runs.length) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
        Henüz otomatik denetim çalıştırılmamış.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {runs.map((r) => (
        <div
          key={r.id}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          {/* HEADER */}
          <div
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
            onClick={() => setOpenId(openId === r.id ? null : r.id)}
          >
            <div>
              <div className="font-semibold text-slate-900">
                {r.template_name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {new Date(r.ran_at).toLocaleString("tr-TR")}
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-sm font-medium text-slate-700">
                %{r.completion_rate}
              </div>
              <span className="text-indigo-600 text-sm font-medium">
                {openId === r.id ? "Kapat" : "Detay"}
              </span>
            </div>
          </div>

          {/* EXPAND */}
          {openId === r.id && (
            <div className="border-t border-slate-200 px-5 py-4">
              <table className="w-full text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="text-left py-2">Operatör</th>
                    <th className="text-left">Durum</th>
                    <th className="text-left">Gönderim</th>
                  </tr>
                </thead>

                <tbody>
                  {r.operators.map((o) => (
                    <tr
                      key={o.operator_id}
                      className="border-t border-slate-100"
                    >
                      <td className="py-3 text-slate-800">
                        {o.operator_name ?? "—"}
                      </td>

                      <td>
                        <OperatorBadge state={o.state} />
                      </td>

                      <td className="text-slate-600">
                        {o.submitted_at
                        ? new Date(o.submitted_at).toLocaleString("tr-TR")
                        : o.state === "overdue"
                        ? "Süresi geçti"
                        : "Henüz gönderilmedi"}
                      </td>
                    </tr>
                  ))}

                  {r.operators.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 text-center text-slate-400"
                      >
                        Bu çalışmada operatör bulunmuyor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
