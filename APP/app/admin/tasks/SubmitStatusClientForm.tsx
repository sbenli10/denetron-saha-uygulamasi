"use client";

import { useState } from "react";
import ScheduleBuilder, {
  BuilderState,
} from "@/components/assign/ScheduleBuilder";
import { TemplateDTO, OperatorDTO } from "@/components/assign/types";

interface Props {
  action: (fd: FormData) => Promise<{ success: boolean; message: string }>;
  templates: TemplateDTO[];
  operators: OperatorDTO[];
  isPremium: boolean;          // ✅ EKLENDİ
  role: string | null;         // ✅ EKLENDİ
}

export default function SubmitStatusClientForm({
  action,
  templates,
  operators,
  isPremium,
  role,
}: Props) {
  const [state, setState] = useState<BuilderState>({
    templateId: "",
    operatorIds: [],
    frequency: "daily",
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: null,
    runTime: "09:00",
    duePolicy: "hours", // ✅
    dueValue: 24,       // ✅ DB default ile uyumlu
  });


  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const fd = new FormData();
    fd.append("template_id", state.templateId);
    fd.append("operator_ids", JSON.stringify(state.operatorIds));
    fd.append("frequency", state.frequency);
    fd.append("interval", String(state.interval));
    fd.append("day_of_week", state.dayOfWeek ? String(state.dayOfWeek) : "");
    fd.append("day_of_month", state.dayOfMonth ? String(state.dayOfMonth) : "");
    fd.append("run_time", state.runTime);
    fd.append("due_policy", state.duePolicy);
    fd.append("due_value", String(state.dueValue));

    const res = await action(fd);
    setResult(res);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Schedule Builder */}
      <ScheduleBuilder
        templates={templates}
        operators={operators}
        isPremium={isPremium}     // ✅ ZORUNLU
        role={role}               // ✅ ZORUNLU
        returnState={(builderState) => {
          setState(builderState);
        }}
      />

      {/* Sonuç */}
      {result && (
        <div
          className={`p-4 rounded-xl border ${
            result.success
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
              : "bg-red-500/20 text-red-300 border-red-400/40"
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-black hover:bg-amber-400 transition"
      >
        Atamayı Oluştur
      </button>
    </form>
  );
}
