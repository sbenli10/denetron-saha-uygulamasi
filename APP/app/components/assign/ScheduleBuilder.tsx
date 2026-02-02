//APP\app\components\assign\ScheduleBuilder.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateDTO, OperatorDTO } from "./types";
import CronScheduler from "./CronScheduler";
import OperatorDragDrop from "./OperatorDragDrop";
import OperatorPickerPanel from "./OperatorPickerPanel";
import TemplatePicker from "./TemplatePicker";

/* --------------------------------------------
   STATE TYPE
-------------------------------------------- */
// APP/app/components/assign/ScheduleBuilder.tsx

export interface BuilderState {
  templateId: string;
  operatorIds: string[];

  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;

  // 🔽 YENİ EKLENENLER
  runTime: string;                 // "09:00"
  duePolicy: "same_day" | "hours" | "days";
  dueValue: number;
}

interface ScheduleBuilderProps {
  templates: TemplateDTO[];
  operators: OperatorDTO[];
  returnState?: (state: BuilderState) => void;
  isPremium: boolean;
  role: string | null;
}

/* --------------------------------------------
   UI BASE
-------------------------------------------- */
const cardBase =
  "relative rounded-2xl bg-white/80 border border-slate-200 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)]";

/* --------------------------------------------
   STEP HEADER
-------------------------------------------- */
function StepHeader({ step, title, active, completed }: any) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl transition border cursor-pointer
        ${
          active
            ? "bg-indigo-50 border-indigo-300 shadow"
            : completed
            ? "bg-slate-50 border-slate-300"
            : "bg-white border-slate-200"
        }`}
    >
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm
          ${active ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}
      >
        {completed ? "✓" : step}
      </div>
      <span className={active ? "font-semibold" : "text-slate-600"}>
        {title}
      </span>
    </div>
  );
}

/* --------------------------------------------
   SUMMARY PANEL
-------------------------------------------- */
function SummaryPanel({
  template,
  operators,
  cronPreview,
  isPremium,
}: {
  template: TemplateDTO | null;
  operators: OperatorDTO[];
  cronPreview: string;
  isPremium: boolean;
}) {
  return (
    <div className={`${cardBase} p-6 sticky top-10`}>
      <h3 className="text-xl font-semibold mb-4">Görev Özeti</h3>

      <p className="text-sm text-slate-500">Şablon</p>
      <p className="mb-4">{template?.name ?? "-"}</p>

      <p className="text-sm text-slate-500">Operatörler</p>
      <ul className="mb-4 list-disc list-inside">
        {operators.map((op) => (
          <li key={op.id}>{op.full_name}</li>
        ))}
      </ul>

      <p className="text-sm text-slate-500">
        {isPremium ? "Zamanlama (Önizleme)" : "Görev Türü"}
      </p>

      {isPremium ? (
        <code className="text-indigo-600 text-sm block mt-1">
          {cronPreview || "-"}
        </code>
      ) : (
        <span className="inline-block mt-1 px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
          Bu görev tek seferliktir
        </span>
      )}
    </div>
  );
}

/* --------------------------------------------
   MAIN COMPONENT
-------------------------------------------- */
export default function ScheduleBuilder({
  templates,
  operators,
  returnState,
  isPremium,
}: ScheduleBuilderProps) {
  const [templateId, setTemplateId] = useState("");
  const [operatorIds, setOperatorIds] = useState<string[]>([]);
  const [frequency, setFrequency] =
    useState<"daily" | "weekly" | "monthly">("daily");
  const [interval, setInterval] = useState(1);
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);
  const [dayOfMonth, setDayOfMonth] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [runTime, setRunTime] = useState("09:00");
  const [duePolicy, setDuePolicy] = useState<"same_day" | "hours" | "days">("same_day");
  const [dueValue, setDueValue] = useState(1);

  /* -----------------------------
     STEP DEFINITIONS (NET)
  ----------------------------- */
  const steps = isPremium
    ? ["Şablon", "Operatörler", "Zamanlama", "Onay"]
    : ["Şablon", "Operatörler", "Onay"];

  const lastStep = steps.length;

  /* -----------------------------
     STATE → FORM SYNC
  ----------------------------- */
useEffect(() => {
  returnState?.({
    templateId,
    operatorIds,
    frequency,
    interval,
    dayOfWeek,
    dayOfMonth,
    runTime,
    duePolicy,
    dueValue,
  });
}, [
  templateId,
  operatorIds,
  frequency,
  interval,
  dayOfWeek,
  dayOfMonth,
  runTime,
  duePolicy,
  dueValue,
]);


  /* -----------------------------
     CRON PREVIEW (UI ONLY)
  ----------------------------- */
  const cronPreview = useMemo(() => {
    if (!isPremium) return "";
    if (frequency === "daily") return `0 0 */${interval} * *`;
    if (frequency === "weekly") return `0 0 * * ${dayOfWeek ?? "*"}`;
    if (frequency === "monthly") return `0 0 ${dayOfMonth ?? "*"} * *`;
    return "";
  }, [frequency, interval, dayOfWeek, dayOfMonth, isPremium]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-8">
        {/* STEP HEADERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((title, idx) => (
            <div key={idx} onClick={() => setActiveStep(idx + 1)}>
              <StepHeader
                step={idx + 1}
                title={title}
                active={activeStep === idx + 1}
                completed={activeStep > idx + 1}
              />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeStep === 1 && (
            <motion.div className={`${cardBase} p-6`}>
              <TemplatePicker
                templates={templates}
                value={templateId}
                onChange={setTemplateId}
              />
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div className={`${cardBase} p-6`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OperatorPickerPanel
                  operators={operators}
                  selected={operatorIds}
                  onAdd={(id) =>
                    !operatorIds.includes(id) &&
                    setOperatorIds([...operatorIds, id])
                  }
                />
                <OperatorDragDrop
                  operators={operators}
                  value={operatorIds}
                  onChange={setOperatorIds}
                  onRemove={(id) =>
                    setOperatorIds(operatorIds.filter((x) => x !== id))
                  }
                />
              </div>
            </motion.div>
          )}

          {isPremium && activeStep === 3 && (
            <motion.div className={`${cardBase} p-6`}>
              <CronScheduler
                frequency={frequency}
                interval={interval}
                dayOfWeek={dayOfWeek}
                dayOfMonth={dayOfMonth}
                runTime={runTime}
                duePolicy={duePolicy}
                dueValue={dueValue}
                onFrequencyChange={setFrequency}
                onIntervalChange={setInterval}
                onDayOfWeekChange={setDayOfWeek}
                onDayOfMonthChange={setDayOfMonth}
                onRunTimeChange={setRunTime}
                onDuePolicyChange={setDuePolicy}
                onDueValueChange={setDueValue}
              />

            </motion.div>
          )}

          {/* FINAL STEP */}
          {activeStep === lastStep && (
            <motion.div className={`${cardBase} p-6 space-y-4`}>
              
          {/* INFO BOX */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
            {isPremium ? (
              <>
                <p className="font-semibold text-slate-900 mb-1">
                  Otomatik görev oluşturulacak
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>{operatorIds.length} operatöre görev atanacak</li>
                  <li>Zamanlama: <code className="text-indigo-600">{cronPreview}</code></li>
                  <li>Görevler bu kurala göre otomatik oluşturulacak</li>
                </ul>
              </>
            ) : (
              <>
                <p className="font-semibold text-slate-900 mb-1">
                  Tek seferlik görev oluşturulacak
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Görev <strong>hemen</strong> oluşturulacak</li>
                  <li>Sadece <strong>1 operatöre</strong> atanabilir</li>
                  <li>Bu görev tekrar etmeyecek</li>
                </ul>
              </>
            )}
          </div>

          {/* CTA */}
          <div className="text-right">
            <button
              type="submit"
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              Görevi Kaydet
            </button>
          </div>
        </motion.div>
      )}

        </AnimatePresence>
      </div>

      <SummaryPanel
        template={templates.find((t) => t.id === templateId) ?? null}
        operators={operators.filter((o) => operatorIds.includes(o.id))}
        cronPreview={cronPreview}
        isPremium={isPremium}
      />
    </div>
  );
}
