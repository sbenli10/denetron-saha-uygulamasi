"use client";

import Link from "next/link";
import {
  WifiOff,
  ClipboardList,
  Play,
  Mic,
  Maximize2,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/* -------------------- TYPES -------------------- */

interface OperatorHomeStats {
  todayTasks: number;
  completedInspections: number;
  openForms: number;
  highRisk?: number;
}

interface OperatorHomeProps {
  stats?: OperatorHomeStats;
}

/* -------------------- COMPONENT -------------------- */

export default function OperatorHome({
  stats = {
    todayTasks: 3,
    completedInspections: 12,
    openForms: 1,
    highRisk: 0,
  },
}: OperatorHomeProps) {
  const online = useOnlineStatus();

  return (
    <div className="relative flex flex-col gap-6">
      {/* ==================== STATUS / ONLINE ==================== */}
      <section className="rounded-2xl border border-bg700 bg-bg800/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-neutral-200">
            Durum
          </div>

          <div
            className={[
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
              online
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
                : "border-amber-400/70 bg-amber-500/15 text-amber-100 animate-pulse",
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                online ? "bg-emerald-400" : "bg-amber-300",
              ].join(" ")}
            />
            {online ? "Çevrimiçi" : "Çevrimdışı"}
          </div>
        </div>

        {!online && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-300">
            <WifiOff className="h-3.5 w-3.5" />
            Offline modda çalışıyorsunuz. Kayıtlar sıraya alınır.
          </div>
        )}
      </section>

      {/* ==================== KPI GRID ==================== */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiMini label="Bugün" value={stats.todayTasks} />
        <KpiMini label="Denetim" value={stats.completedInspections} />
        <KpiMini label="Açık Form" value={stats.openForms} />
        <KpiMini
          label="Yüksek Risk"
          value={stats.highRisk ?? 0}
          danger
        />
      </section>

      {/* ==================== PRIMARY ACTIONS ==================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/operator/tasks"
          className="flex items-center justify-between rounded-2xl bg-bg800 px-4 py-4"
        >
          <span className="text-sm font-medium text-neutral-200">
            Görevlerim
          </span>
          <ClipboardList className="h-5 w-5 text-neutral-400" />
        </Link>

        <Link
          href="/operator/forms"
          className="flex items-center justify-between rounded-2xl bg-bg800 px-4 py-4"
        >
          <span className="text-sm font-medium text-neutral-200">
            Açık Formlar
          </span>
          <ClipboardList className="h-5 w-5 text-neutral-400" />
        </Link>

        <Link
          href="/operator/history"
          className="flex items-center justify-between rounded-2xl bg-bg800 px-4 py-4 sm:col-span-2"
        >
          <span className="text-sm font-medium text-neutral-200">
            Tamamlanan Denetimler
          </span>
          <ClipboardList className="h-5 w-5 text-neutral-400" />
        </Link>
      </section>

      {/* ==================== FIELD QUICK ACTIONS ==================== */}
      <section className="rounded-2xl border border-bg700 bg-bg800/80 p-4">
        <div className="mb-3 text-sm font-medium text-neutral-200">
          Saha İşlemleri
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ActionMini
            icon={Play}
            label="Denetime Başla"
            primary
          />
          <ActionMini icon={Camera} label="Foto Ekle" />
          <ActionMini icon={Mic} label="Sesli Not" />
        </div>
      </section>
    </div>
  );
}

/* -------------------- UI HELPERS -------------------- */

function KpiMini({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl px-3 py-3 text-center",
        danger
          ? "bg-danger/10 border border-danger/30"
          : "bg-bg800",
      ].join(" ")}
    >
      <div className="text-[10px] text-neutral-400">
        {label}
      </div>
      <div
        className={[
          "text-lg font-semibold",
          danger ? "text-danger" : "text-neutral-50",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function ActionMini({
  icon: Icon,
  label,
  primary,
}: {
  icon: any;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        "flex flex-col items-center justify-center gap-2 rounded-xl py-4 text-xs font-medium",
        primary
          ? "bg-primary text-black"
          : "bg-bg700 text-neutral-200",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
