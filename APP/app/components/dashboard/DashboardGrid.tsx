"use client";

import KPIWidget from "./widgets/KPIWidget";
import ChartWidget from "./widgets/ChartWidget";
import HeatmapWidget from "./widgets/HeatmapWidget";

import {
  ClipboardCheck,
  FileText,
  Sparkles,
  ArrowRight,
  LayoutGrid,
} from "lucide-react";

export interface Trend30Item {
  day: string;
  count: number;
}
export interface Trend12mItem {
  month: string;
  count: number;
}
export interface RecentActivity {
  id: string;
  status: string;
  updated_at: string;
  operator_name?: string;
  operator_email?: string;
}

interface DashboardGridProps {
  activeInspections: number;
  completedTasks: number;
  newUsers: number;
  pendingReports: number;
  trend30: Trend30Item[];
  trend12m: Trend12mItem[];
  heatmap90: { date: string; count: number }[];
  recentActivities: RecentActivity[];
}

function statusTitle(status: string) {
  switch (status) {
    case "completed":
      return "Görev tamamlandı";
    case "waiting_review":
      return "İnceleme bekliyor";
    case "in_progress":
      return "Devam ediyor";
    case "assigned":
      return "Atandı";
    default:
      return "Güncellendi";
  }
}

function QuickCard({ title, desc }: { title: string; desc: string }) {
  return (
    <button
      type="button"
      className="
        group w-full text-left rounded-2xl
        bg-card/60 border border-border/60 backdrop-blur-xl
        p-4 sm:p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px]
        transition-all
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">
            {title}
          </div>
          <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {desc}
          </div>
        </div>

        <ArrowRight
          className="
            mt-0.5 h-4 w-4 text-muted-foreground
            group-hover:text-foreground transition
          "
        />
      </div>
    </button>
  );
}

export default function DashboardGrid({
  activeInspections,
  completedTasks,
  newUsers,
  pendingReports,
  trend30,
  trend12m,
  heatmap90,
  recentActivities,
}: DashboardGridProps) {
  return (
    <div className="space-y-8 fade-in">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operasyon verileri, trendler ve son aktiviteler.
          </p>
        </div>
      </div>

      {/* KPI GRID – Audit Odaklı */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">

        {/* RİSK & BEKLEYENLER */}
        <KPIWidget
          title="Bekleyen Raporlar"
          value={pendingReports}
          trend={-2}
          intent="danger"
          helper="SLA aşımı riski taşıyan raporlar"
        />

        <KPIWidget
          title="Yeni Kullanıcılar"
          value={newUsers}
          trend={5}
          intent="neutral"
          helper="Son 30 günde eklenen kullanıcılar"
        />

        {/* OPERASYON */}
        <KPIWidget
          title="Aktif Denetimler"
          value={activeInspections}
          trend={12}
          intent="warning"
          helper="Devam eden denetim süreçleri"
        />

        <KPIWidget
          title="Tamamlanan Görevler"
          value={completedTasks}
          trend={8}
          intent="success"
          helper="Zamanında tamamlanan denetimler"
        />

      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* MAIN CHART */}
        <div className="lg:col-span-8">
          <ChartWidget
            title="Denetim Trendleri"
            description="7G / 30G / 12A görünümü"
            data7d={trend30.slice(-7).map((d) => ({ label: d.day, value: d.count }))}
            data30d={trend30.map((d) => ({ label: d.day, value: d.count }))}
            data12m={trend12m.map((d) => ({ label: d.month, value: d.count }))}
          />
        </div>

        

        {/* HEATMAP */}
        <div className="lg:col-span-4">
          <HeatmapWidget data={heatmap90} />
        </div>
      </div>
    </div>
  );
}
