"use client";

import { Timer, Clock, AlarmClock } from "lucide-react";

interface Props {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  runTime: string;
  duePolicy: "same_day" | "hours" | "days";
  dueValue: number;
}

export default function CronPreview(props: Props) {
  const {
    frequency,
    interval,
    dayOfWeek,
    dayOfMonth,
    runTime,
    duePolicy,
    dueValue,
  } = props;

  const slaText =
    duePolicy === "same_day"
      ? "Aynı gün bitiş"
      : duePolicy === "hours"
      ? `${dueValue} saat içinde`
      : `${dueValue} gün içinde`;

  return (
    <div className="p-6 rounded-xl bg-slate-900 text-slate-200 space-y-4">
      <div className="flex items-center gap-2">
        <Timer size={18} /> Zamanlama Önizlemesi
      </div>

      <div className="text-sm">
        ⏰ <strong>{runTime}</strong> saatinde çalışır
      </div>

      <div className="text-sm">
        🔁{" "}
        {frequency === "daily" && `Her ${interval} günde bir`}
        {frequency === "weekly" &&
          `Her ${interval} haftada bir — Gün: ${dayOfWeek ?? "?"}`}
        {frequency === "monthly" &&
          `Her ${interval} ayda bir — Gün: ${dayOfMonth ?? "?"}`}
      </div>

      <div className="text-sm">
        ⏳ SLA: <strong>{slaText}</strong>
      </div>

      <div className="text-xs text-slate-400">
        Gerçek hayatta görev <b>{runTime}</b>’da atanır ve SLA bu andan itibaren
        başlar.
      </div>
    </div>
  );
}
