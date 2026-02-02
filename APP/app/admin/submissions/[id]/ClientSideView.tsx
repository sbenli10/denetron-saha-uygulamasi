"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  AlertTriangle,
} from "lucide-react";
import PremiumModal from "./premium-modal";
import { AnswerCollapse } from "../(detail)/AnswerComponents";
import type {
  RawAnswer,
  SubmissionRecord,
} from "@/types/submission";

interface ClientProps {
  submission: SubmissionRecord;
  grouped: Record<string, RawAnswer[]>;
  isPremium: boolean;
  role: string;
  submissionId: string;
}

// lib/utils/formatters.ts
export function formatTurkishLabel(input: string): string {
  if (!input) return "—";

  return input
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/Gorsel/g, "Görsel")
    .replace(/Guvenlik/g, "Güvenlik")
    .replace(/Makine/g, "Makine")
    .replace(/Kontrol/g, "Kontrol");
}


export default function ClientSideView({
  submission,
  grouped,
  isPremium,
  role,
  submissionId,
}: ClientProps) {
  const [showPremium, setShowPremium] = useState(false);

  const isCompleted = Boolean(submission.completed_at);
  const canCreateDof =
    isCompleted &&
    submission.severity === "critical" &&
    role !== "operator";

  const severityTrMap: Record<
  "low" | "medium" | "high" | "critical",
  string
> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
  critical: "Kritik",
};


  return (
    <div className="space-y-10 pb-24">
      {/* ───────────────── HEADER BAR ───────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/submissions"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black"
          >
            <ChevronLeft className="w-4 h-4" />
            Denetimler
          </Link>

          <h1 className="text-2xl font-semibold text-gray-900">
            Denetim Detayı
          </h1>

          {submission.severity === "critical" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold">
              <AlertTriangle className="w-4 h-4" />
              Kritik Risk
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isPremium ? (
            <button
              onClick={() =>
                window.open(
                  `/api/admin/submissions/${submissionId}/generate-pdf`,
                  "_blank"
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-700"
            >
              <FileText className="w-4 h-4" />
              PDF Raporu
            </button>
          ) : (
            <button
              onClick={() => setShowPremium(true)}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-500"
            >
              Premium Gerekli
            </button>
          )}

          {canCreateDof && (
            <Link
              href={`/admin/submissions/${submissionId}/dof`}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white shadow hover:bg-rose-700"
            >
              DÖF Oluştur
            </Link>
          )}
        </div>
      </div>

      {showPremium && (
        <PremiumModal
          onClose={() => setShowPremium(false)}
          role={role}
        />
      )}

      {/* ───────────────── SUMMARY ───────────────── */}
      <section className="rounded-3xl bg-white shadow p-8">
        <h2 className="text-lg font-semibold mb-6">
          Yönetici Özeti
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <Summary label="Tamamlanma">
            {submission.completed_at
              ? new Date(
                  submission.completed_at
                ).toLocaleString("tr-TR")
              : "Devam Ediyor"}
          </Summary>

          <Summary label="Operatör">
            {submission.operator_name ??
              submission.operator_email ??
              "—"}
          </Summary>

          <Summary label="Şablon">
            {submission.template_name ?? "—"}
          </Summary>

          <Summary label="Risk Seviyesi">
            <SeverityBadge
              severity={submission.severity}
            />
          </Summary>
        </div>
      </section>

      {/* ───────────────── FINDINGS ───────────────── */}
      <section className="space-y-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Bulgular ve Cevaplar
        </h2>

        <div className="rounded-3xl bg-white shadow p-8 space-y-10">
          {Object.entries(grouped).map(
            ([category, items]) => (
              <CategoryBlock
                key={category}
                category={category}
                items={items}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}

/* ───────────────── SUB COMPONENTS ───────────────── */

function Summary({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl border bg-gray-50">
      <p className="text-xs text-gray-500">
        {label}
      </p>
      <p className="mt-1 font-medium text-gray-900">
        {children}
      </p>
    </div>
  );
}

function SeverityBadge({
  severity,
}: {
  severity: string | null;
}) {
  if (!severity) return <>—</>;

  const colorMap = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
    critical: "bg-red-200 text-red-800",
  };

  const labelMap = {
    low: "Düşük",
    medium: "Orta",
    high: "Yüksek",
    critical: "Kritik",
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
        colorMap[severity as keyof typeof colorMap]
      }`}
    >
      {labelMap[severity as keyof typeof labelMap]}
    </span>
  );
}

function CategoryBlock({
  category,
  items,
}: {
  category: string;
  items: RawAnswer[];
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">
        {formatTurkishLabel(category)}
      </h3>
      {items.map((item, idx) => (
        <AnswerCollapse
          key={idx}
          answer={{
            label:
              item.questionText ?? "—",
            value: item.answer,
            critical:
              item.answer === "no" ||
              item.severity === "critical",
            findingText:
              item.findingText ?? null,
            severity:
              item.severity ?? null,
            media: Array.isArray(item.media)
              ? item.media.map(m => ({
                  file_id: m.id,
                  url: m.url,
                  type: m.type,
                }))
              : [],
          }}
        />
      ))}
    </div>
  );
}
