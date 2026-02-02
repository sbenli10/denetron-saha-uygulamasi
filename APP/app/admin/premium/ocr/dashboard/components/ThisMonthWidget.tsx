"use client";

import { useMemo } from "react";
import { AnnualPlanItem } from "@/app/admin/isg/annual-plan/AnnualPlanTable";



export function ThisMonthWidget({ items }: { items: AnnualPlanItem[] }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1–12

  const dueItems = useMemo(() => {
    console.log("📅 [ThisMonthWidget] Calculating month:", currentMonth);

    return items.filter((item) => {
      const plannedThisMonth = item.plannedMonths.includes(currentMonth);
      const notExecuted =
        !item.executedMonths ||
        !item.executedMonths.includes(currentMonth);

      return plannedThisMonth && notExecuted;
    });
  }, [items, currentMonth]);

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-4 shadow-sm">
      <h3 className="text-lg font-semibold">
        📌 Bu Ay Yapılacaklar
      </h3>

      {dueItems.length === 0 && (
        <p className="text-sm text-gray-500">
          Bu ay için bekleyen faaliyet yok 🎉
        </p>
      )}

      {dueItems.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-orange-200 bg-orange-50 p-4"
        >
          <p className="font-medium">{item.activity}</p>

          <p className="text-xs text-gray-600 mt-1">
            Risk Seviyesi: <b>{item.riskLevel}</b>
          </p>

          <button
            className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
            onClick={() => {
              console.log("➕ [ThisMonthWidget] Create execution for:", item);
            }}
          >
            ➕ Kanıt Yükle / Yapıldı İşaretle
          </button>
        </div>
      ))}
    </div>
  );
}
