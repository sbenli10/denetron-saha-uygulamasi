"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Play,
  ClipboardList,
  CheckSquare,
  History,
  AlertTriangle,
  Camera,
  Mic,
  QrCode,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Badge, Button, Card, CardContent, CardHeader, SectionTitle, StatCard } from "@/app/components/ui/ui";
import { cn } from "@/app/components/ui/cn";

/* -------------------- TYPES -------------------- */

export interface OperatorHomeStats {
  todayTasks: number;
  completedInspections: number;
  openForms: number;
  highRisk?: number;
  overdue?: number;
  nextDueText?: string;
}

interface OperatorHomeProps {
  stats?: OperatorHomeStats;
}

/* -------------------- COMPONENT -------------------- */

export default function OperatorHome({
  stats = {
    todayTasks: 0,
    completedInspections: 0,
    openForms: 0,
    highRisk: 0,
    overdue: 0,
    nextDueText: "",
  },
}: OperatorHomeProps) {
  const online = useOnlineStatus();

  const hasRisk = (stats.highRisk ?? 0) > 0;
  const hasOverdue = (stats.overdue ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* PRIMARY START CTA */}
      <div className="sticky top-[72px] z-10">
        <Link
          href="/operator/start"
          className={cn(
            "flex items-center justify-between rounded-[var(--op-radius-3xl)]",
            "bg-[color:var(--op-primary)] text-black",
            "px-5 h-[var(--op-touch)] shadow-[var(--op-shadow-2)]",
            "border border-[color:color-mix(in_oklab,var(--op-primary)_55%,black)]",
            "active:scale-[0.99] transition"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-black/15 flex items-center justify-center">
              <Play className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-extrabold truncate">Denetime Başla</div>
              <div className="text-[11px] font-semibold opacity-80 truncate">
                Tek dokunuşla saha kaydı oluştur
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!online ? (
              <Badge tone="warning" className="border-0 bg-black/15 text-black">
                Çevrimdışı
              </Badge>
            ) : (
              <Badge tone="success" className="border-0 bg-black/15 text-black">
                Çevrimiçi
              </Badge>
            )}
          </div>
        </Link>
      </div>

      {/* PRIORITY BANNERS */}
      {hasOverdue ? (
        <Card className="border-[color:color-mix(in_oklab,var(--op-danger)_45%,transparent)] bg-[color:color-mix(in_oklab,var(--op-danger)_12%,transparent)]">
          <CardHeader>
            <SectionTitle
              title={`${stats.overdue} görev gecikmiş`}
              subtitle="Öncelik: gecikmiş görevleri kapatın"
              right={<ShieldAlert className="h-5 w-5 text-white" />}
            />
          </CardHeader>
          <CardContent className="pt-2">
            <Button href="/operator/tasks?filter=overdue" tone="danger" size="lg" className="w-full">
              Gecikmiş Görevleri Aç
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {hasRisk ? (
        <Card className="border-[color:color-mix(in_oklab,var(--op-warning)_45%,transparent)] bg-[color:color-mix(in_oklab,var(--op-warning)_12%,transparent)]">
          <CardHeader>
            <SectionTitle
              title={`${stats.highRisk} yüksek risk tespit edildi`}
              subtitle="Hemen kontrol edin ve aksiyon başlatın"
              right={<AlertTriangle className="h-5 w-5 text-white" />}
            />
          </CardHeader>
          <CardContent className="pt-2">
            <Button href="/operator/history" tone="warning" size="lg" className="w-full">
              Riskli Kayıtları Gör
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* KPI GRID */}
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Bugünkü Görev" value={stats.todayTasks} icon={ClipboardList} tone="primary" />
        <StatCard label="Tamamlanan Denetim" value={stats.completedInspections} icon={History} tone="neutral" />
        <StatCard label="Açık Form" value={stats.openForms} icon={CheckSquare} tone="neutral" />
        <StatCard label="Yüksek Risk" value={stats.highRisk ?? 0} icon={AlertTriangle} tone={hasRisk ? "warning" : "neutral"} />
      </section>

      {/* NEXT DUE */}
      <Card>
        <CardHeader>
          <SectionTitle
            title="Öncelik"
            subtitle="Yaklaşan termin ve hızlı erişim"
            right={<Timer className="h-5 w-5 text-[color:var(--op-primary-2)]" />}
          />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[color:var(--op-border)] bg-black/15 px-4 py-3">
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-[color:var(--op-muted)]">
                En Yakın Termin
              </div>
              <div className="text-[14px] font-extrabold truncate">
                {stats.nextDueText && stats.nextDueText.length > 0 ? stats.nextDueText : "Planlı görev yok"}
              </div>
            </div>
            <Button href="/operator/tasks" tone="neutral" size="sm">
              Görevler
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QUICK ACTIONS */}
      <Card>
        <CardHeader>
          <SectionTitle title="Saha Kısayolları" subtitle="Tek elle hızlı aksiyon" />
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Quick href="/operator/start" icon={Play} title="Denetime Başla" subtitle="Yeni kayıt" tone="primary" />
            <Quick href="/operator/scan" icon={QrCode} title="QR ile Başla" subtitle="Ekipman/alan" tone="neutral" />
            <Quick href="/operator/start?mode=photo" icon={Camera} title="Foto Ekle" subtitle="Kanıt" tone="neutral" />
            <Quick href="/operator/start?mode=voice" icon={Mic} title="Sesli Not" subtitle="Hızlı not" tone="neutral" />
          </div>
        </CardContent>
      </Card>

      {/* NAV SHORTCUTS (clean) */}
      <section className="grid grid-cols-1 gap-3">
        <NavRow href="/operator/tasks" icon={ClipboardList} title="Görevlerim" desc="Açık, gecikmiş, tamamlanan" />
        <NavRow href="/operator/forms" icon={CheckSquare} title="Formlar" desc="Kontrol listeleri ve kayıtlar" />
        <NavRow href="/operator/history" icon={History} title="Geçmiş" desc="Tamamlanan denetimler" />
      </section>

      <div className="h-6" />
    </div>
  );
}

/* -------------------- UI PARTS -------------------- */

function Quick({
  href,
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tone: "neutral" | "primary";
}) {
  const base =
    "rounded-[var(--op-radius-2xl)] border p-4 shadow-[var(--op-shadow-1)] active:scale-[0.99] transition";

  const cls =
    tone === "primary"
      ? cn(
          base,
          "bg-[color:color-mix(in_oklab,var(--op-primary)_18%,transparent)]",
          "border-[color:color-mix(in_oklab,var(--op-primary)_38%,transparent)]"
        )
      : cn(base, "bg-[color:var(--op-surface-1)] border-[color:var(--op-border)]");

  return (
    <Link href={href} className={cls}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold truncate">{title}</div>
          <div className="text-[11px] text-[color:var(--op-muted)] truncate">{subtitle}</div>
        </div>
        <div className="h-11 w-11 rounded-2xl border border-[color:var(--op-border)] bg-black/15 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

function NavRow({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-3 rounded-[var(--op-radius-2xl)] border",
        "bg-[color:var(--op-surface-1)] border-[color:var(--op-border)]",
        "px-4 py-4 shadow-[var(--op-shadow-1)] active:scale-[0.99] transition"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-12 w-12 rounded-2xl border border-[color:var(--op-border)] bg-black/15 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[color:var(--op-primary-2)]" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold truncate">{title}</div>
          <div className="text-[11px] text-[color:var(--op-muted)] truncate">{desc}</div>
        </div>
      </div>
      <span className="text-[color:var(--op-subtle)] text-[18px] font-extrabold">›</span>
    </Link>
  );
}
