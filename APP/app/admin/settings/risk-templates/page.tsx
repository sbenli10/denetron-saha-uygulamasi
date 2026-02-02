"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RiskTemplateAdminPage() {
  const { data } = useSWR("/api/risk-templates/list", fetcher);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-semibold">
        Risk Şablonları
      </h1>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th>Alan</th>
            <th>Ekipman</th>
            <th>Risk</th>
            <th>Faaliyet</th>
          </tr>
        </thead>
        <tbody>
          {data?.templates.map((t: any) => (
            <tr key={t.id} className="border-t">
              <td>{t.area}</td>
              <td>{t.equipment}</td>
              <td>{t.risk_text}</td>
              <td>{t.action_text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
