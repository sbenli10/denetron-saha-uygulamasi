// supabase/functions/task-scheduler/computeNextRun.ts
import { DateTime } from "https://esm.sh/luxon@3.4.3";

type Frequency = "daily" | "weekly" | "monthly";

export function computeNextRun(input: {
  frequency: Frequency;
  interval: number;
  timezone: string;

  // DB'den gelen "bir önceki planlanan zaman": schedule.next_run_at
  base_next_run_at: string;

  // DB'den gelen run_time: "09:00:00"
  run_time: string;

  // weekly/monthly opsiyonel alanlar
  day_of_week?: number | null;   // 0-6 (0 pazar)
  day_of_month?: number | null;  // 1-31
}): string {
  const tz = input.timezone || "Europe/Istanbul";

  // base = "planlanan zaman" (drift engeli)
  let base = DateTime.fromISO(input.base_next_run_at, { zone: tz });
  if (!base.isValid) base = DateTime.now().setZone(tz);

  const now = DateTime.now().setZone(tz);

  const [hh, mm, ss] = String(input.run_time || "09:00:00")
    .split(":")
    .map((x) => parseInt(x, 10));

  const safeInterval = Math.max(1, Number(input.interval || 1));

  const applyRunTime = (dt: DateTime) =>
    dt.set({
      hour: Number.isFinite(hh) ? hh : 9,
      minute: Number.isFinite(mm) ? mm : 0,
      second: Number.isFinite(ss) ? ss : 0,
      millisecond: 0,
    });

  const clampDayOfMonth = (dt: DateTime, wantedDay: number) => {
    const dim = dt.daysInMonth ?? 28;
    return Math.min(Math.max(1, wantedDay), dim);
  };

  // Bir sonraki planlanan zamanı üret
  const nextOnce = (b: DateTime) => {
    if (input.frequency === "daily") {
      return applyRunTime(b.plus({ days: safeInterval }));
    }

    if (input.frequency === "weekly") {
      // Eğer day_of_week kullanıyorsan: bir sonraki hedef güne git
      // (base'e göre, "now" değil)
      const targetDow = input.day_of_week ?? null;

      if (targetDow === null || targetDow === undefined) {
        return applyRunTime(b.plus({ weeks: safeInterval }));
      }

      // Luxon weekday: 1..7 (Mon..Sun). Bizde 0..6 (Sun..Sat)
      const currentDow = b.weekday % 7; // Sun=0
      let diff = targetDow - currentDow;
      if (diff <= 0) diff += 7;

      // Önce bir sonraki target güne, sonra interval haftayı uygula
      const firstTarget = b.plus({ days: diff });
      const withInterval = firstTarget.plus({ weeks: safeInterval - 1 });

      return applyRunTime(withInterval);
    }

    if (input.frequency === "monthly") {
      const wanted = input.day_of_month ?? null;

      if (wanted === null || wanted === undefined) {
        return applyRunTime(b.plus({ months: safeInterval }));
      }

      // Bu ay içinde "wanted day" ayarla (ay sonunu clamp'le)
      let candidate = b.set({
        day: clampDayOfMonth(b, wanted),
      });

      candidate = applyRunTime(candidate);

      // Eğer candidate base'in gerisinde/eşitse, ileri ay
      if (candidate <= b) {
        const moved = b.plus({ months: safeInterval });
        candidate = applyRunTime(
          moved.set({ day: clampDayOfMonth(moved, wanted) })
        );
      }

      return candidate;
    }

    throw new Error("invalid frequency");
  };

  // Catch-up: cron geç çalıştıysa, next_run_at’ı geleceğe taşı
  // (sonsuz loop engeli için max 36 adım)
  let next = nextOnce(base);
  let guard = 0;
  while (next <= now && guard < 36) {
    next = nextOnce(next);
    guard += 1;
  }

  // DB timestamptz için UTC ISO yazmak en temizidir
  return next.toUTC().toISO()!;
}
