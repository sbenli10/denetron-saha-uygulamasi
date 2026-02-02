"use client";

import { useState } from "react";

export default function ManualFirstItemModal({
  dofId,
  onClose,
  onSuccess,
}: {
  dofId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [risk, setRisk] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!risk.trim()) return alert("Risk tanımı zorunludur.");

    setLoading(true);

    await fetch("/api/dof/manual/item/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dof_id: dofId,
        risk_description: risk,
        action_description:
          action || "Düzeltici faaliyet belirlenecektir",
        is_first: true,
      }),
    });

    setLoading(false);
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-xl rounded-2xl p-8 space-y-6">
        {/* HEADER */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            İlk DÖF Maddesini Oluştur
          </h2>
          <p className="text-sm text-gray-600">
            Bu adım, DÖF sürecini resmen başlatır.
          </p>
        </div>

        {/* RISK */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Risk / Uygunsuzluk Tanımı
          </label>
          <textarea
            value={risk}
            onChange={e => setRisk(e.target.value)}
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Örn: Vinç halatında gözle görülür aşınma mevcuttur."
          />
        </div>

        {/* ACTION */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Planlanan Düzeltici Faaliyet (opsiyonel)
          </label>
          <textarea
            value={action}
            onChange={e => setAction(e.target.value)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Boş bırakabilirsiniz."
          />
        </div>

        {/* INFO */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
          ℹ️ Risk seviyesi, öneriler ve mevzuat eşleşmeleri bir sonraki
          adımda yapay zekâ ile oluşturulacaktır.
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border"
          >
            Vazgeç
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white"
          >
            {loading ? "Oluşturuluyor…" : "DÖF’i Başlat"}
          </button>
        </div>
      </div>
    </div>
  );
}
