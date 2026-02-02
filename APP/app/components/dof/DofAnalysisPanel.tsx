// APP/app/components/dof/DofAnalysisPanel.tsx
"use client";

import { useState } from "react";

type Props = {
  submissionId?: string; // 🔥 ARTIK OPSİYONEL
  criticalCount: number;
};

export default function DofAnalysisPanel({
  submissionId,
  criticalCount,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  async function runAnalysis() {
    if (!submissionId) return;

    setLoading(true);
    const res = await fetch("/api/dof/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ submission_id: submissionId }),
    });

    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  /* ================= SUBMISSION YOKSA ================= */
  if (!submissionId) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          🧠 Yapay Zekâ Analizi
        </h2>
        <p>
          Bu DÖF operatör girdileriyle oluşturulmuştur.
          Yapay zekâ analizi, denetim kaynaklı DÖF’lerde
          otomatik olarak çalışır.
        </p>
      </div>
    );
  }

  /* ================= NORMAL DURUM ================= */
  return (
    <div className="rounded-2xl border bg-white p-6 space-y-4">
      <h2 className="text-xl font-semibold">
        🧠 DÖF Analizi ({criticalCount} kritik)
      </h2>

      <button
        onClick={runAnalysis}
        disabled={loading}
        className="inline-flex items-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? "Analiz ediliyor…" : "AI ile Analiz Et"}
      </button>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((i, idx) => (
            <div key={idx} className="rounded-lg border p-4">
              <p className="font-medium text-gray-900">
                {i.corrective_action}
              </p>
              <p className="text-sm text-gray-500">
                {i.iso} – Güven: %{i.confidence}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
