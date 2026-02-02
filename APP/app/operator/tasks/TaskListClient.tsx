//APP\app\operator\tasks\TaskListClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { TaskFilterTabs, TaskFilter } from "./TaskFilterTabs";

interface TaskRow {
  id: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  due_date: string | null;
  template_name: string | null;
}


function getEffectiveStatus(t: TaskRow): TaskRow["status"] {
  if (
    t.due_date &&
    new Date(t.due_date).getTime() < Date.now() &&
    t.status !== "completed"
  ) {
    return "overdue";
  }
  return t.status;
}



function fmtDate(date?: string | null) {
  return date
    ? new Date(date).toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Tarih yok";
}

  export function TaskListClient({ rows }: { rows: TaskRow[] }) {
    const [filter, setFilter] = useState<TaskFilter>("all");

    const filteredRows = rows.filter(t => {
      const status = getEffectiveStatus(t);

      if (filter === "all") return true;
      if (filter === "open")
        return status === "pending" || status === "in_progress";
      if (filter === "completed") return status === "completed";
      if (filter === "overdue") return status === "overdue";
      return true;
    });


    return (
    <div className="space-y-3">
      <TaskFilterTabs value={filter} onChange={setFilter} />

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-5 text-center text-sm text-neutral-400">
          Bu filtreye ait görev yok.
        </div>
      ) : (
        filteredRows.map(t => {
          const status = getEffectiveStatus(t);

          return (
            <div
              key={t.id}
              className="rounded-2xl border border-white/10 bg-black/80 p-4"
            >
              <div className="space-y-3">
                {/* BAŞLIK */}
                <div>
                  <div className="text-sm font-semibold text-neutral-50">
                    {t.template_name ?? "Tanımsız Görev"}
                  </div>

                  <div className="mt-1 text-xs text-neutral-400">
                    Son Tarih: {fmtDate(t.due_date)}
                  </div>
                </div>

                {/* AKSİYON */}
                {status === "completed" ? (
                  <div className="
                    flex items-center justify-center gap-2
                    h-11 w-full
                    rounded-xl
                    border border-emerald-400/30
                    bg-emerald-400/10
                    text-[13px] font-semibold text-emerald-300
                  ">
                    ✓ Tamamlandı
                  </div>
                ) : status === "overdue" ? (
                  <div className="
                    flex items-center justify-center gap-2
                    h-11 w-full
                    rounded-xl
                    bg-danger
                    text-[13px] font-semibold text-white
                    shadow-lg shadow-danger/40
                  ">
                    ⏰ Süresi Doldu
                  </div>
                ) : (
                  <Link
                      href={`/operator/tasks/${t.id}/run`}
                      className="
                        flex items-center justify-center gap-2
                        h-11 w-full
                        rounded-xl
                        bg-primary
                        text-[13px] font-semibold text-white
                        shadow-lg shadow-primary/40
                        active:scale-[0.98]
                        transition
                      "
                    >
                      ▶ Formu Aç
                    </Link>

                )}

              </div>
            </div>
          );
        })
      )}
    </div>
  );

}
