// APP/app/components/assign/CronScheduler.tsx
"use client";

import { Repeat, Clock, Hourglass } from "lucide-react";

export type DuePolicy = "hours" | "days";

export interface CronProps {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  dayOfWeek: number | null;   // ✅ 0-6 (Pzt=0 ... Paz=6)
  dayOfMonth: number | null;  // 1-31
  runTime: string;            // "HH:mm"

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

  // ✅ DB uyumlu: 0-6 (Pzt=0 ... Paz=6)
  const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Repeat className="text-indigo-600" />
        <div>
          <h2 className="text-lg font-semibold">Zamanlama Ayarları</h2>
          <p className="text-sm text-slate-500 mt-1">
            Bu ayarlar, görevlerin ne zaman ve hangi sıklıkla otomatik oluşturulacağını belirler.
          </p>
        </div>
      </div>

      {/* RUN TIME */}
      <div>
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Clock size={16} /> Çalışma Saati
        </label>
        <p className="text-xs text-slate-500 mt-1">
          Görevler seçtiğiniz saatte otomatik oluşturulur. (Örn: 09:00)
        </p>

        <input
          type="time"
          value={runTime}
          onChange={(e) => onRunTimeChange(e.target.value)}
          className="mt-2 px-3 py-2 border rounded-lg"
        />
      </div>

      {/* FREQUENCY */}
      <div>
        <label className="text-sm font-medium text-slate-700">Görev Sıklığı</label>
        <p className="text-xs text-slate-500 mt-1">
          Günlük / Haftalık / Aylık seçenekleriyle tekrar biçimini seçin.
        </p>

        <div className="grid grid-cols-3 gap-3 mt-3">
          {(["daily", "weekly", "monthly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFrequencyChange(f)}
              className={`p-3 rounded-xl border transition ${
                frequency === f
                  ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                  : "bg-white border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f === "daily" && "Günlük"}
              {f === "weekly" && "Haftalık"}
              {f === "monthly" && "Aylık"}
            </button>
          ))}
        </div>
      </div>

      {/* INTERVAL */}
      <div>
        <label className="text-sm font-medium text-slate-700">Tekrar Aralığı</label>
        <p className="text-xs text-slate-500 mt-1">
          Kaç günde / haftada / ayda bir tekrar edeceğini belirler. (Min: 1)
        </p>

        <input
          type="number"
          min={1}
          value={interval}
          onChange={(e) => onIntervalChange(Math.max(1, +e.target.value || 1))}
          className="mt-2 w-24 px-3 py-2 border rounded-lg"
        />
      </div>

      {/* WEEKLY */}
      {frequency === "weekly" && (
        <div>
          <label className="text-sm font-medium text-slate-700">Haftanın Günü</label>
          <p className="text-xs text-slate-500 mt-1">
            Görevin hangi gün otomatik oluşturulacağını seçin.
          </p>

          <div className="grid grid-cols-7 gap-2 mt-2">
            {days.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onDayOfWeekChange(dayOfWeek === i ? null : i)}
                className={`py-2 rounded-lg border transition ${
                  dayOfWeek === i
                    ? "bg-indigo-100 border-indigo-400"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-2">
            Not: Sistem tarafında günler 0-6 aralığında tutulur (Pzt=0, …, Paz=6).
          </p>
        </div>
      )}

      {/* MONTHLY */}
      {frequency === "monthly" && (
        <div>
          <label className="text-sm font-medium text-slate-700">Ayın Günü</label>
          <p className="text-xs text-slate-500 mt-1">
            Görevin ayın hangi gününde otomatik oluşturulacağını seçin (1–31).
          </p>

          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth ?? ""}
            onChange={(e) => {
              const v = +e.target.value;
              onDayOfMonthChange(Number.isFinite(v) && v >= 1 && v <= 31 ? v : null);
            }}
            className="mt-2 w-24 px-3 py-2 border rounded-lg"
          />
        </div>
      )}

      {/* SLA */}
      <div className="pt-4 border-t space-y-3">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <Hourglass size={16} /> SLA (Bitiş Süresi)
        </label>
        <p className="text-xs text-slate-500">
          Oluşturulan görevlerin en geç ne kadar sürede tamamlanması gerektiğini belirler.
        </p>

        <div className="flex items-center gap-3">
          <select
            value={duePolicy}
            onChange={(e) => onDuePolicyChange(e.target.value as DuePolicy)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="hours">X Saat Sonra</option>
            <option value="days">X Gün Sonra</option>
          </select>

          <input
            type="number"
            min={1}
            value={dueValue}
            onChange={(e) => onDueValueChange(Math.max(1, +e.target.value || 1))}
            className="w-24 px-3 py-2 border rounded-lg"
          />

          <span className="text-sm text-slate-500">
            {duePolicy === "hours" ? "saat" : "gün"}
          </span>
        </div>
      </div>
    </div>
  );
}
