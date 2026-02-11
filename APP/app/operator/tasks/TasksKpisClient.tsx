"use client";

import { ClipboardList, History, AlertTriangle } from "lucide-react";
import { StatCard } from "@/app/components/ui/ui";

export function TasksKpisClient({
  total,
  open,
  completed,
  overdue,
}: {
  total: number;
  open: number;
  completed: number;
  overdue: number;
}) {
  const hasOverdue = overdue > 0;

  return (
    <section className="grid grid-cols-2 gap-3">
      <StatCard label="Toplam" value={total} icon={ClipboardList} tone="neutral" />
      <StatCard label="Açık / Devam" value={open} icon={ClipboardList} tone="primary" />
      <StatCard label="Tamamlanan" value={completed} icon={History} tone="success" />
      <StatCard
        label="Gecikmiş"
        value={overdue}
        icon={AlertTriangle}
        tone={hasOverdue ? "danger" : "neutral"}
      />
    </section>
  );
}
