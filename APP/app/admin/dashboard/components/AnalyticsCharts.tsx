"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Line = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), { ssr: false });

export default function AnalyticsCharts() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/analytics")
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return <p>Yükleniyor...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ChartCard title="Gönderim Sayısı">
        <Line
          data={{
            labels: data.submissions.map((x: any) =>
              new Date(x.created_at).toLocaleDateString()
            ),
            datasets: [
              {
                label: "Gönderimler",
                data: data.submissions.map(() => 1),
                borderColor: "#4F46E5",
              },
            ],
          }}
        />
      </ChartCard>

      <ChartCard title="OCR Kullanımı">
        <Line
          data={{
            labels: data.ocrUsage.map((x: any) =>
              new Date(x.created_at).toLocaleDateString()
            ),
            datasets: [
              {
                label: "OCR İşlemleri",
                data: data.ocrUsage.map(() => 1),
                borderColor: "#FBBF24",
              },
            ],
          }}
        />
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="rounded-xl border p-4 bg-white shadow-sm">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
