"use server";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { computeNextRun } from "@/lib/cron/computeNextRun";
import type { WeekdayNumbers } from "luxon";

function parseWeekday(
  value: FormDataEntryValue | null
): WeekdayNumbers | null {
  if (!value) return null;

  const n = Number(value);

  if (n < 1 || n > 7) return null;

  return n as WeekdayNumbers;
}
export async function saveSchedule(_prev: any, formData: FormData) {
  const { member, user } = await getAdminContext();

  if (!member || !user) {
    return { success: false, message: "Yetkisiz" };
  }

  const raw = Object.fromEntries(formData.entries());

  const operatorIds: string[] = JSON.parse(
    (raw.operator_ids as string) || "[]"
  );

  if (!raw.template_id || operatorIds.length === 0) {
    return { success: false, message: "Eksik veri" };
  }

  /* ---------------------------------------
     🔥 EN KRİTİK NOKTA
     İlk çalışacağı zamanı burada hesaplıyoruz
  --------------------------------------- */
    const nextRun = computeNextRun({
      frequency: raw.frequency as "daily" | "weekly" | "monthly",
      interval: Number(raw.interval ?? 1),
      timezone: "Europe/Istanbul",
      day_of_week: parseWeekday(raw.day_of_week),
      day_of_month: raw.day_of_month
        ? Number(raw.day_of_month)
        : null,
    });


  const db = supabaseServiceRoleClient();

  const { error } = await db.from("task_schedules").insert({
    org_id: member.org_id,
    created_by: user.id,
    template_id: raw.template_id,
    operator_ids: operatorIds,

    frequency: raw.frequency,
    interval: Number(raw.interval),
    day_of_week: raw.day_of_week
      ? Number(raw.day_of_week)
      : null,
    day_of_month: raw.day_of_month
      ? Number(raw.day_of_month)
      : null,

    timezone: "Europe/Istanbul",

    next_run_at: nextRun, // 🔥 BURASI OLMAZSA CRON BOŞA ÇALIŞIR
    status: "active",
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "Zamanlama başarıyla oluşturuldu",
  };
}
