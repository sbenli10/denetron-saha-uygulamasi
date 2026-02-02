// APP/app/lib/cron/computeNextRun.ts
import { DateTime, WeekdayNumbers } from "luxon";

export type ComputeNextRunInput = {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;                 // >= 1
  timezone: string;
  day_of_week?: WeekdayNumbers | null; // 1 = Monday ... 7 = Sunday
  day_of_month?: number | null;        // 1..31
};

export function computeNextRun(input: ComputeNextRunInput): string {
  if (input.interval < 1) {
    throw new Error("Interval must be >= 1");
  }

  function asWeekday(n: number): WeekdayNumbers {
  if (n < 1 || n > 7) {
    throw new Error("Invalid weekday value");
  }
  return n as WeekdayNumbers;
}


  const now = DateTime.now()
    .setZone(input.timezone)
    .startOf("minute");

  /* ---------------- DAILY ---------------- */
  if (input.frequency === "daily") {
    return now.plus({ days: input.interval }).toISO()!;
  }

if (input.frequency === "weekly") {
  const targetDow: WeekdayNumbers =
    input.day_of_week ?? asWeekday(now.weekday);

  let next = now.set({ weekday: targetDow });

  if (next <= now) {
    next = next.plus({ weeks: input.interval });
  }

  return next.toISO()!;
}


  /* ---------------- MONTHLY ---------------- */
  if (input.frequency === "monthly") {
    const targetDay =
      input.day_of_month ?? now.day;

    // Bu ayı dene
    let next = now.set({ day: targetDay });

    // Ayda o gün yoksa → ayın son günü
    if (!next.isValid) {
      next = now.endOf("month");
    }

    // Eğer geçmişte kaldıysa → interval ay ileri
    if (next <= now) {
      next = next.plus({ months: input.interval });

      // Örn: Şubat 31 tekrar invalid olabilir
      if (!next.isValid) {
        next = next.endOf("month");
      }
    }

    return next.toISO()!;
  }

  // TypeScript buraya normalde düşmez
  throw new Error("Invalid frequency");
}
