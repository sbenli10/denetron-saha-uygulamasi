// APP/app/operator/tasks/page.tsx
import { getOperatorContext } from "@/lib/operator/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { Activity, Clock } from "lucide-react";
import { TaskListClient } from "./TaskListClient";

export const dynamic = "force-dynamic";

/* ================= TYPES ================= */

interface TaskRow {
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

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/80 to-black/50 p-4">
      <div className="text-[11px] uppercase tracking-wide text-neutral-400">
        {label}
      </div>
      <div className="mt-1 text-3xl font-semibold text-neutral-50">
        {value}
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default async function OperatorTasksPage() {
  const { user, member } = await getOperatorContext();
  const db = supabaseServiceRoleClient();

  const { data, error } = await db
    .from("v_assigned_tasks")
    .select(`
      id,
      status,
      created_at,
      completed_at,
      due_date,
      assigned_at,
      severity,
      template_name
    `)
    .eq("org_id", member.org_id)
    .eq("operator_id", user.id)   // 🔴 KRİTİK SATIR
    .order("assigned_at", { ascending: false });


  if (error) {
    console.error("v_assigned_tasks error:", error);
    return <div className="text-red-400">Görevler yüklenemedi</div>;
  }

  const rows: TaskRow[] = data ?? [];

  /* ================= KPI ================= */

  const total = rows.length;
  const open = rows.filter(r =>
    r.status === "pending" || r.status === "in_progress"
  ).length;
  const completed = rows.filter(r => r.status === "completed").length;
  const overdue = rows.filter(r => r.status === "overdue").length;

  /* ================= NEXT DUE ================= */
  const nextDue =
    rows
      .filter(
        r =>
          r.due_date &&
          r.status !== "completed" &&
          r.status !== "overdue"
      )
      .sort(
        (a, b) =>
          new Date(a.due_date!).getTime() -
          new Date(b.due_date!).getTime()
      )[0]?.due_date ?? null;

  /* ================= UI ================= */

  return (
    <div className="flex h-full flex-col gap-5">
      {/* HEADER */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px]">
          <Activity className="h-3.5 w-3.5 text-amber-300" />
          Operatör Paneli
        </div>

        <h1 className="text-lg font-semibold text-neutral-50">
          Görevlerim
        </h1>

        <p className="text-xs leading-relaxed text-neutral-400">
          Size atanmış görevleri buradan yönetin.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">
        <Kpi label="Toplam Görev" value={total} />
        <Kpi label="Açık / Devam" value={open} />
        <Kpi label="Tamamlanan" value={completed} />
        <Kpi label="Gecikmiş" value={overdue} />
      </div>

      {/* NEXT DUE */}
      <div className="flex items-center justify-between rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[12px]">
        <div className="inline-flex items-center gap-2 font-medium text-amber-200">
          <Clock className="h-4 w-4" />
          En Yakın Termin
        </div>
        <span className="font-semibold text-amber-100">
          {fmtDate(nextDue)}
        </span>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto">
        <TaskListClient rows={rows} />
      </div>
    </div>
  );
}
