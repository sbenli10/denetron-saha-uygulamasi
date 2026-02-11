// APP/app/operator/tasks/page.tsx
import { getOperatorContext } from "@/lib/operator/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { Activity, Clock, ClipboardList, CheckSquare, AlertTriangle, History } from "lucide-react";
import { TaskListClient } from "./TaskListClient";
import { TasksKpisClient } from "./TasksKpisClient";

import { Card, CardContent, CardHeader, SectionTitle, StatCard, Badge, Button } from "@/app/components/ui/ui";

export const dynamic = "force-dynamic";

/* ================= TYPES ================= */

export interface TaskRow {
  id: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  created_at: string;
  completed_at: string | null;
  due_date: string | null;
  assigned_at: string | null;
  severity: string | null;
  template_name: string | null;
}

/* ================= HELPERS ================= */

function fmtDate(date?: string | null) {
  if (!date) return "Tarih yok";
  return new Date(date).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEffectiveStatus(t: Pick<TaskRow, "status" | "due_date">): TaskRow["status"] {
  if (t.due_date && new Date(t.due_date).getTime() < Date.now() && t.status !== "completed") {
    return "overdue";
  }
  return t.status;
}

/* ================= PAGE ================= */

export default async function OperatorTasksPage() {
  const { user, member } = await getOperatorContext();
  const db = supabaseServiceRoleClient();

  const { data, error } = await db
    .from("v_assigned_tasks")
    .select(
      `
      id,
      status,
      created_at,
      completed_at,
      due_date,
      assigned_at,
      severity,
      template_name
    `
    )
    .eq("org_id", member.org_id)
    .eq("operator_id", user.id)
    .order("assigned_at", { ascending: false });

  if (error) {
    console.error("v_assigned_tasks error:", error);
    return <div className="text-[color:var(--op-danger)]">Görevler yüklenemedi</div>;
  }

  const rows: TaskRow[] = data ?? [];

  const total = rows.length;
  const open = rows.filter((r) => {
    const s = getEffectiveStatus(r);
    return s === "pending" || s === "in_progress";
  }).length;

  const completed = rows.filter((r) => getEffectiveStatus(r) === "completed").length;
  const overdue = rows.filter((r) => getEffectiveStatus(r) === "overdue").length;

  const nextDue =
    rows
      .filter((r) => r.due_date && getEffectiveStatus(r) !== "completed" && getEffectiveStatus(r) !== "overdue")
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0]?.due_date ?? null;

  const hasOverdue = overdue > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* HEADER */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge tone="warning" className="border-0 bg-black/15 text-black">
            <Activity className="h-3.5 w-3.5" />
            Operatör Paneli
          </Badge>

          {hasOverdue ? (
            <Badge tone="danger" className="border-0">
              {overdue} gecikmiş
            </Badge>
          ) : (
            <Badge tone="neutral" className="border-0">
              {open} açık
            </Badge>
          )}
        </div>

        <h1 className="text-[18px] font-extrabold text-[color:var(--op-text)]">Görevlerim</h1>
        <p className="text-[12px] leading-relaxed text-[color:var(--op-muted)]">
          Size atanmış görevleri buradan yönetin. Gecikmiş görevler önceliklidir.
        </p>
      </div>

      {/* OVERDUE BANNER */}
      {hasOverdue ? (
        <Card className="border-[color:color-mix(in_oklab,var(--op-danger)_45%,transparent)] bg-[color:color-mix(in_oklab,var(--op-danger)_12%,transparent)]">
          <CardHeader>
            <SectionTitle
              title="Gecikmiş görevler var"
              subtitle="Öncelik: süresi dolan görevleri kapatın"
              right={<AlertTriangle className="h-5 w-5" />}
            />
          </CardHeader>
          <CardContent className="pt-2">
            <Button href="/operator/tasks?filter=overdue" tone="danger" size="lg" className="w-full">
              Gecikmiş Görevleri Filtrele
            </Button>
          </CardContent>
        </Card>
      ) : null}

     <TasksKpisClient
        total={total}
        open={open}
        completed={completed}
        overdue={overdue}
      />

      {/* NEXT DUE */}
      <Card>
        <CardHeader>
          <SectionTitle
            title="En Yakın Termin"
            subtitle="Planlı görevler arasından en erken tarih"
            right={<Clock className="h-5 w-5 text-[color:var(--op-primary-2)]" />}
          />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[color:var(--op-border)] bg-black/15 px-4 py-3">
            <div className="min-w-0">
              <div className="text-[11px] text-[color:var(--op-muted)]">Termin</div>
              <div className="text-[15px] font-extrabold truncate">{fmtDate(nextDue)}</div>
            </div>
            <Button href="/operator/start" tone="primary" size="sm">
              Denetime Başla
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LIST */}
      <div className="flex-1">
        <TaskListClient rows={rows} />
      </div>
    </div>
  );
}
