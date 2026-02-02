"use client";

import { useEffect, useState } from "react";

export type AnnualPlanItem = {
  id?: string;
  activity: string;
  period: string;
  plannedMonths: number[];
  executedMonths?: number[];
  status: "Planlı" | "Bekleniyor" | "Gecikti" | "Yapıldı";
  riskLevel: "Düşük" | "Orta" | "Yüksek";
};

type Props = {
  items: AnnualPlanItem[];
};

export default function AnnualPlanTable({ items }: Props) {
  const [rows, setRows] = useState<AnnualPlanItem[]>([]);

  useEffect(() => {
    console.log("📋 [AnnualPlanTable] Init items:", items);
    setRows(items);
  }, [items]);

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="p-3 text-left">Faaliyet</th>
            <th className="p-3 text-center">Periyot</th>
            <th className="p-3 text-left">Aylar</th>
            <th className="p-3 text-center">Durum</th>
            <th className="p-3 text-center">Risk</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => {
            const isOverdue = row.status === "Gecikti";

            return (
              <tr
                key={idx}
                className={`border-t ${
                  isOverdue ? "bg-red-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="p-3 font-medium">{row.activity}</td>

                <td className="p-3 text-center">{row.period}</td>

                <td className="p-3 text-xs text-gray-600">
                  {row.plannedMonths.join(", ")}
                </td>

                <td className="p-3 text-center">
                  {row.status === "Yapıldı" && "✔ Yapıldı"}
                  {row.status === "Bekleniyor" && "⏳ Bekleniyor"}
                  {row.status === "Gecikti" && "⛔ Gecikti"}
                  {row.status === "Planlı" && "📌 Planlı"}
                </td>

                <td className="p-3 text-center">{row.riskLevel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
