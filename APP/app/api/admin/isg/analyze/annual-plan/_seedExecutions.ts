//APP\app\api\admin\isg\analyze\annual-plan\_seedExecutions.ts
import { SupabaseClient } from "@supabase/supabase-js";

const MONTHS = [
  "ocak","şubat","mart","nisan","mayıs","haziran",
  "temmuz","ağustos","eylül","ekim","kasım","aralık"
];

export async function seedExecutions({
  supabase,
  orgId,
  planYear,
  items,
}: {
  supabase: SupabaseClient;
  orgId: string;
  planYear: number;
  items: any[];
}) {
  console.log("🌱 [SEED] START", { orgId, planYear });

  const executions: any[] = [];

  for (const item of items) {
    const months =
      item.months && item.months.length > 0
        ? item.months
        : ["Ocak"]; // 🔒 OCAK REVİZYONU ZORUNLU

    for (const m of months) {
      let idx = MONTHS.indexOf(m.toLowerCase());
      if (idx === -1) {
        console.warn("⚠️ Ay çözülemedi, Ocak varsayıldı:", m);
        idx = 0;
      }
      executions.push({
        organization_id: orgId,
        plan_year: planYear,
        activity: item.activity,
        planned_period: item.period,
        planned_month: idx + 1,
        executed: false,
      });
    }
  }

  if (!executions.length) {
    console.warn("⚠️ SEED boş, execution oluşturulmadı");
    return;
  }

  const { error } = await supabase
    .from("annual_plan_executions")
    .insert(executions);

  if (error) {
    console.error("❌ SEED DB ERROR:", error);
    throw error;
  }

  console.log("✅ SEED OK:", executions.length);
}
