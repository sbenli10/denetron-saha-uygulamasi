// APP/app/operator/tasks/TaskListClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Play, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { TaskFilterTabs, TaskFilter } from "./TaskFilterTabs";

import { Badge, Button, Card } from "@/app/components/ui/ui";

/* ================= TYPES ================= */

export interface TaskRow {
  id: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  due_date: string | null;
  template_name: string | null;
}

/* ================= HELPERS ================= */

function getEffectiveStatus(t: TaskRow): TaskRow["status"] {
  if (t.due_date && new Date(t.due_date).getTime() < Date.now() && t.status !== "completed") {
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

type StatusMeta = {
  label: string;
  tone: "neutral" | "success" | "warning" | "danger";
  icon: LucideIcon;
};

function statusMeta(status: TaskRow["status"]): StatusMeta {
  switch (status) {
    case "completed":
      return { label: "Tamamlandı", tone: "success", icon: CheckCircle2 };
    case "overdue":
      return { label: "Süresi Doldu", tone: "danger", icon: AlertTriangle };
    case "in_progress":
      return { label: "Devam", tone: "warning", icon: Play };
    case "pending":
    default:
      return { label: "Açık", tone: "neutral", icon: CalendarClock };
  }
}

/* ================= COMPONENT ================= */

export function TaskListClient({ rows }: { rows: TaskRow[] }) {
  const [filter, setFilter] = useState<TaskFilter>("all");

  const filteredRows = useMemo(() => {
    return rows.filter((t) => {
      const status = getEffectiveStatus(t);

      if (filter === "all") return true;
      if (filter === "open") return status === "pending" || status === "in_progress";
      if (filter === "completed") return status === "completed";
      if (filter === "overdue") return status === "overdue";
      return true;
    });
  }, [rows, filter]);

  return (
    <div className="space-y-3">
      <TaskFilterTabs value={filter} onChange={setFilter} />

      {filteredRows.length === 0 ? (
        <div className="rounded-[var(--op-radius-2xl)] border border-[color:var(--op-border)] bg-[color:var(--op-surface-1)] p-6 text-center">
          <div className="text-[13px] font-semibold text-[color:var(--op-text)]">Kayıt bulunamadı</div>
          <div className="mt-1 text-[12px] text-[color:var(--op-muted)]">Bu filtreye ait görev yok.</div>
        </div>
      ) : (
        filteredRows.map((t) => {
          const effective = getEffectiveStatus(t);
          const meta = statusMeta(effective);
          const MetaIcon = meta.icon;

          const isDone = effective === "completed";
          const isOverdue = effective === "overdue";

          return (
            <Card
              key={t.id}
              className={[
                "overflow-hidden",
                isOverdue
                  ? "border-[color:color-mix(in_oklab,var(--op-danger)_45%,transparent)] bg-[color:color-mix(in_oklab,var(--op-danger)_10%,transparent)]"
                  : "border-[color:var(--op-border)]",
              ].join(" ")}
            >
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-extrabold text-[color:var(--op-text)] truncate">
                      {t.template_name ?? "Tanımsız Görev"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-[color:var(--op-muted)]">
                      <CalendarClock className="h-4 w-4" />
                      <span className="truncate">Son Tarih: {fmtDate(t.due_date)}</span>
                    </div>
                  </div>

                  <Badge tone={meta.tone} className="shrink-0">
                    <MetaIcon className="h-3.5 w-3.5" />
                    {meta.label}
                  </Badge>
                </div>
              </div>

              <div className="px-4 pb-4">
                {isDone ? (
                  <div className="h-[var(--op-touch)] w-full rounded-[var(--op-radius-2xl)] border border-[color:color-mix(in_oklab,var(--op-success)_35%,transparent)] bg-[color:color-mix(in_oklab,var(--op-success)_14%,transparent)] text-[color:var(--op-text)] flex items-center justify-center gap-2 font-extrabold">
                    <CheckCircle2 className="h-5 w-5" />
                    Tamamlandı
                  </div>
                ) : isOverdue ? (
                  <Link href={`/operator/tasks/${t.id}/run`} className="block" aria-label="Gecikmiş görevi aç">
                    <div className="h-[var(--op-touch)] w-full rounded-[var(--op-radius-2xl)] bg-[color:var(--op-danger)] text-white shadow-[var(--op-shadow-1)] flex items-center justify-center gap-2 font-extrabold active:scale-[0.99] transition">
                      <AlertTriangle className="h-5 w-5" />
                      Süresi Doldu — Aç
                    </div>
                  </Link>
                ) : (
                  <Button
                    href={`/operator/tasks/${t.id}/run`}
                    tone="primary"
                    size="lg"
                    leftIcon={Play}
                    className="w-full"
                  >
                    Formu Aç
                  </Button>
                )}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
