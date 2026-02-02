// APP/app/components/assign/CronScheduler.tsx
"use client";

import { Calendar, Timer, Repeat, Clock, Hourglass } from "lucide-react";

export type DuePolicy = "same_day" | "hours" | "days";

export interface CronProps {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;

  runTime: string; // "09:00"
  duePolicy: DuePolicy;
  dueValue: number;

  onFrequencyChange: (v: "daily" | "weekly" | "monthly") => void;
  onIntervalChange: (v: number) => void;
  onDayOfWeekChange: (v: number | null) => void;
  onDayOfMonthChange: (v: number | null) => void;

  onRunTimeChange: (v: string) => void;
  onDuePolicyChange: (v: DuePolicy) => void;
  onDueValueChange: (v: number) => void;
}

export default function CronScheduler(props: CronProps) {
  const {
    frequency,
    interval,
    dayOfWeek,
    dayOfMonth,
    runTime,
    duePolicy,
    dueValue,
    onFrequencyChange,
    onIntervalChange,
    onDayOfWeekChange,
    onDayOfMonthChange,
    onRunTimeChange,
    onDuePolicyChange,
    onDueValueChange,
  } = props;

  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Repeat className="text-indigo-600" />
        <h2 className="text-lg font-semibold">Zamanlama Ayarları</h2>
      </div>

      {/* RUN TIME */}
      <div>
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Clock size={16} /> Çalışma Saati
        </label>
        <input
          type="time"
          value={runTime}
          onChange={(e) => onRunTimeChange(e.target.value)}
          className="mt-2 px-3 py-2 border rounded-lg"
        />
      </div>

      {/* FREQUENCY */}
      <div className="grid grid-cols-3 gap-3">
        {["daily", "weekly", "monthly"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFrequencyChange(f as any)}
            className={`p-3 rounded-xl border ${
              frequency === f
                ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                : "bg-white border-slate-200"
            }`}
          >
            {f === "daily" && "Günlük"}
            {f === "weekly" && "Haftalık"}
            {f === "monthly" && "Aylık"}
          </button>
        ))}
      </div>

      {/* INTERVAL */}
      <div>
        <label className="text-sm font-medium">Tekrar Aralığı</label>
        <input
          type="number"
          min={1}
          value={interval}
          onChange={(e) => onIntervalChange(+e.target.value || 1)}
          className="mt-2 w-24 px-3 py-2 border rounded-lg"
        />
      </div>

      {/* WEEKLY */}
      {frequency === "weekly" && (
        <div>
          <label className="text-sm font-medium">Gün Seç</label>
          <div className="grid grid-cols-7 gap-2 mt-2">
            {days.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onDayOfWeekChange(dayOfWeek === i + 1 ? null : i + 1)}
                className={`py-2 rounded-lg ${
                  dayOfWeek === i + 1
                    ? "bg-indigo-100 border border-indigo-400"
                    : "bg-white border"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MONTHLY */}
      {frequency === "monthly" && (
        <div>
          <label className="text-sm font-medium">Ayın Günü</label>
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth ?? ""}
            onChange={(e) => onDayOfMonthChange(+e.target.value || null)}
            className="mt-2 w-24 px-3 py-2 border rounded-lg"
          />
        </div>
      )}

      {/* SLA */}
      <div className="pt-4 border-t space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <Hourglass size={16} /> SLA (Bitiş Süresi)
        </label>

        <select
          value={duePolicy}
          onChange={(e) => onDuePolicyChange(e.target.value as DuePolicy)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="same_day">Aynı Gün</option>
          <option value="hours">X Saat Sonra</option>
          <option value="days">X Gün Sonra</option>
        </select>

        {duePolicy !== "same_day" && (
          <input
            type="number"
            min={1}
            value={dueValue}
            onChange={(e) => onDueValueChange(+e.target.value || 1)}
            className="w-24 px-3 py-2 border rounded-lg"
          />
        )}
      </div>
    </div>
  );
}
