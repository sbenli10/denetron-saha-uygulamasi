"use client";

import { useState } from "react";

export default function DofAddItemModal({
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
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const isValid = risk.trim() && action.trim();

  async function handleSubmit() {
    if (!isValid || loading) return;
    setLoading(true);

    // 1️⃣ Maddeyi oluştur
    const res = await fetch("/api/dof/add-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dof_id: dofId,
        risk_description: risk,
        action_description: action,
      }),
    });

    if (!res.ok) {
      alert("Madde eklenemedi");
      setLoading(false);
      return;
    }

    const { item } = await res.json();

    // 2️⃣ Fotoğraflar varsa yükle
    if (files.length > 0) {
      const formData = new FormData();
      files.forEach(f => formData.append("files", f));
      formData.append("dof_item_id", item.id);

      await fetch("/api/dof/item/upload-files", {
        method: "POST",
        body: formData,
      });
    }

    setLoading(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 space-y-6 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              İlk DÖF Maddesini Oluştur
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Bu adımda yalnızca temel bilgileri girmeniz yeterlidir.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Risk */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-900">
            Uygunsuzluk / Risk Tanımı <span className="text-red-500">*</span>
          </label>
          <textarea
            value={risk}
            onChange={e => setRisk(e.target.value)}
            rows={3}
            placeholder="Örn: Zemin kaygan ve uyarı levhası bulunmuyor."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500">
            Kısa ve net bir açıklama yeterlidir.
          </p>
        </div>

        {/* Action */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-900">
            Planlanan Düzeltici Faaliyet <span className="text-red-500">*</span>
          </label>
          <textarea
            value={action}
            onChange={e => setAction(e.target.value)}
            rows={3}
            placeholder="Örn: Zemin temizlenecek ve kaymaz uyarı levhası yerleştirilecek."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500">
            Nasıl bir aksiyon alınacağını kısaca belirtin.
          </p>
        </div>

        {/* Files */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-900">
            Fotoğraf (Opsiyonel)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e =>
              setFiles(
                e.target.files ? Array.from(e.target.files) : []
              )
            }
            className="block w-full text-sm"
          />
          <p className="text-xs text-gray-500">
            Uygunsuzluğu gösteren fotoğraf eklemeniz önerilir.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Vazgeç
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className={`rounded-lg px-6 py-2 text-sm font-semibold text-white
              ${
                !isValid || loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "Kaydediliyor…" : "Kaydet ve Devam Et"}
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center">
          Diğer detaylar (risk seviyesi, mevzuat, değerlendirme)
          bir sonraki adımda otomatik olarak oluşturulacaktır.
        </p>
      </div>
    </div>
  );
}
