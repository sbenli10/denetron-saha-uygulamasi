// APP/app/components/assign/BulkAssignSummary.tsx
"use client";

import { ClipboardList, Users, Repeat } from "lucide-react";
import { TemplateDTO, OperatorDTO } from "./types";

interface Props {
  templateId: string;
  operatorIds: string[];

  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
}

export default function BulkAssignSummary({
  templateId,
  operatorIds,
  frequency,
  interval,
  dayOfWeek,
  dayOfMonth,
}: Props) {
  const frequencyLabel =
    frequency === "daily"
      ? "Günlük"
      : frequency === "weekly"
      ? "Haftalık"
      : "Aylık";

  const cronDescription = (() => {
    if (frequency === "daily") return `Her ${interval} günde bir`;

    if (frequency === "weekly")
      return `Her ${interval} haftada bir — ${dayOfWeek || "?"}. gün`;

    return `Her ${interval} ayda bir — Ayın ${dayOfMonth || "?"}. günü`;
  })();

  return (
    <div
      className="
        p-6 
        rounded-xl 
        bg-slate-900/60 
        border border-slate-700 
        shadow-xl 
        backdrop-blur-xl
        space-y-6
      "
    >
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <ClipboardList className="text-amber-300" size={22} />
        <h2 className="text-lg font-semibold text-slate-200">
          Görev Planı Özeti
        </h2>
      </div>

      <div className="h-px bg-slate-700/50" />

      {/* TEMPLATE SUMMARY */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <ClipboardList size={16} className="text-amber-300" />
          Şablon
        </div>

        <div
          className="
            text-slate-100 font-medium 
            bg-slate-800/50 
            px-3 py-2 
            rounded-lg 
            border border-slate-700
          "
        >
          {templateId ? templateId : "Henüz seçilmedi"}
        </div>
      </div>

      {/* OPERATORS */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Users size={16} className="text-amber-300" />
          Atanan Operatörler
        </div>

        <div className="space-y-2">
          {operatorIds.length === 0 && (
            <div className="text-slate-500 text-sm italic">
              Operatör seçilmedi
            </div>
          )}

          {operatorIds.map((id) => (
            <div
              key={id}
              className="
                text-slate-100 
                bg-slate-800/40 
                px-3 py-2 
                rounded-lg 
                border border-slate-700
              "
            >
              {id}
            </div>
          ))}
        </div>
      </div>

      {/* SCHEDULE SUMMARY */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Repeat size={16} className="text-amber-300" />
          Otomatik Görev
        </div>

        <div
          className="
            text-slate-100 font-medium 
            bg-slate-800/40 
            px-3 py-3 
            rounded-lg 
            border border-slate-700 
            leading-relaxed
          "
        >
          <div className="text-amber-300 font-semibold">
            {frequencyLabel} Planı
          </div>

          <div className="text-slate-300 text-sm mt-1">{cronDescription}</div>
        </div>
      </div>
    </div>
  );
}
