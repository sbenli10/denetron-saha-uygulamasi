"use client";

import KPIWidget from "./widgets/KPIWidget";
import ChartWidget from "./widgets/ChartWidget";
import HeatmapWidget from "./widgets/HeatmapWidget";
import ListWidget from "./widgets/ListWidget";
import WidgetContainer from "./widgets/WidgetContainer";
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

        {/* <button
          type="button"
          className="
            inline-flex items-center justify-center gap-2
            rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground
            shadow-lg hover:opacity-90 transition focus:outline-none
            focus-visible:ring-2 focus-visible:ring-primary/40
          "
        >
          <Sparkles className="h-4 w-4" />
          Create with AI
        </button> */}
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        <KPIWidget title="Aktif Denetimler" value={activeInspections} trend={12} trendUp />
        <KPIWidget title="Tamamlanan Görevler" value={completedTasks} trend={8} trendUp />
        <KPIWidget title="Yeni Kullanıcılar" value={newUsers} trend={5} trendUp />
        <KPIWidget title="Bekleyen Raporlar" value={pendingReports} trend={2} trendUp={false} />
      </div>

      {/* GETTING STARTED
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          Hızlı Başlangıç
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickCard title="Inspections Dashboard" desc="Denetim KPI ve eğilimlerini takip edin." />
          <QuickCard title="Actions Dashboard" desc="Görev süreçlerini ve hızını izleyin." />
          <QuickCard title="Issues Dashboard" desc="Açık sorunlarınızı yönetin ve önceliklendirin." />
          <QuickCard title="Eğitim Oluşturma" desc="AI ile kurum içi eğitim hazırlayın." />
        </div>
      </div> */}

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

        {/* INSIGHTS
        <div className="lg:col-span-4">
          <WidgetContainer
            title="Insights"
            description="Algılanan sinyaller ve AI önerileri"
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/60 p-4 backdrop-blur-xl">
                <div className="text-sm font-semibold text-foreground">
                  “Daily equipment inspection”
                </div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Yüksek flag oranı (%65). Eğitim hazırlamanız önerilir.
                </div>

                <button
                  type="button"
                  className="
                    mt-3 inline-flex items-center justify-center gap-2
                    rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium
                    hover:bg-accent/40 transition
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                  "
                >
                  Eğitim Oluştur
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs text-muted-foreground">
                Bu alan gerçek zamanlı içgörü API’sine bağlanabilir.
              </div>
            </div>
          </WidgetContainer>
        </div> */}

        {/* HEATMAP */}
        <div className="lg:col-span-4">
          <HeatmapWidget data={heatmap90} />
        </div>

        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-8">
          <ListWidget
            title="Son İşlemler"
            description="Sistem üzerinde yapılan en güncel hareketler"
            emptyText="Kayıt bulunamadı"
            items={recentActivities.map((r) => ({
              id: r.id,
              title: statusTitle(r.status),
              description: `Operatör: ${r.operator_name ?? r.operator_email ?? "Bilinmiyor"}`,
              icon:
                r.status === "completed" ? (
                  <ClipboardCheck size={18} className="text-emerald-600" />
                ) : (
                  <FileText size={18} className="text-amber-600" />
                ),
              time: r.updated_at,
            }))}
          />
        </div>
      </div>

     
      {/* <WidgetContainer
        title="Kayıtlar"
        description="Son güncellenen kayıtların tablo görünümü"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            placeholder="Search…"
            className="
              w-full sm:max-w-xs rounded-xl border border-border bg-card px-3 py-2 text-sm
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
            "
          />
          <div className="text-sm text-muted-foreground">
            {recentActivities.length} results
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden sm:grid grid-cols-12 bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground">
            <div className="col-span-4">İşlem</div>
            <div className="col-span-4">Operatör</div>
            <div className="col-span-4 text-right">Güncelleme</div>
          </div>

          <div className="divide-y divide-border">
            {recentActivities.slice(0, 8).map((r) => (
              <div
                key={r.id}
                className="
                  px-4 py-3 text-sm transition hover:bg-accent/40
                  sm:grid sm:grid-cols-12 sm:items-center
                "
              >
                <div className="sm:hidden">
                  <div className="font-medium text-foreground truncate">
                    {statusTitle(r.status)}
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground truncate">
                    {r.operator_name ?? r.operator_email ?? "Bilinmiyor"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.updated_at).toLocaleString("tr-TR")}
                  </div>
                </div>

                <div className="hidden sm:block sm:col-span-4 font-medium text-foreground truncate">
                  {statusTitle(r.status)}
                </div>
                <div className="hidden sm:block sm:col-span-4 text-muted-foreground truncate">
                  {r.operator_name ?? r.operator_email ?? "Bilinmiyor"}
                </div>
                <div className="hidden sm:block sm:col-span-4 text-right text-muted-foreground">
                  {new Date(r.updated_at).toLocaleString("tr-TR")}
                </div>
              </div>
            ))}

            {recentActivities.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Kayıt bulunamadı
              </div>
            )}
          </div>
        </div>
      </WidgetContainer> */}
    </div>
  );
}
