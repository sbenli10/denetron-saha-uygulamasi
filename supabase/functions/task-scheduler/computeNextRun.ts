//supabase\functions\task-scheduler\computeNextRun.ts
import { DateTime } from "https://esm.sh/luxon@3.4.3";

export function computeNextRun(input: {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  timezone: string;
  day_of_week?: number;
  day_of_month?: number;
}): string {
  const now = DateTime.now().setZone(input.timezone);

  if (input.frequency === "daily") {
    return now.plus({ days: input.interval }).toISO();
  }

  if (input.frequency === "weekly") {
    const currentDow = now.weekday % 7;
    const targetDow = input.day_of_week ?? currentDow;

    let diff = targetDow - currentDow;
    if (diff <= 0) diff += 7;

    return now.plus({ days: diff, weeks: input.interval - 1 }).toISO();
  }

  if (input.frequency === "monthly") {
    const day = input.day_of_month ?? now.day;

    let next = now.set({ day });
    if (next <= now) next = next.plus({ months: input.interval });

    return next.toISO();
  }

  throw new Error("invalid frequency");
}
