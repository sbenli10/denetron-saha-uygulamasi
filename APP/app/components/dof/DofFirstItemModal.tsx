"use client";

import { useState } from "react";

export default function DofFirstItemModal({
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

  const isValid = risk.trim() !== "" && action.trim() !== "";

  async function handleSubmit() {
    if (!isValid || loading) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("dof_id", dofId);
    formData.append("risk_description", risk);
    formData.append("action_description", action);
    files.forEach(f => formData.append("files", f));

    const res = await fetch("/api/dof/item/create-first", {
      method: "POST",
      body: formData,
    });

    setLoading(false);

    if (!res.ok) {
      alert("Madde eklenemedi");
      return;
    }

    onSuccess(); // mutate()
    onClose();   // modal kapanır → FAZ 2
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 space-y-6 shadow-xl">

        {/* HEADER */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            İlk DÖF Maddesini Oluştur
          </h2>
          <p className="text-sm text-gray-600">
            Raporu başlatmak için yalnızca temel bilgileri girmeniz yeterlidir.
            Diğer detaylar sonraki adımda oluşturulacaktır.
          </p>
        </div>

        {/* RISK */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Uygunsuzluk / Risk Tanımı <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={risk}
            onChange={e => setRisk(e.target.value)}
            placeholder="Örn: Pompa koruyucu muhafazası eksik"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* ACTION */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Planlanan Düzeltici Faaliyet <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={action}
            onChange={e => setAction(e.target.value)}
            placeholder="Örn: Uygun muhafaza temin edilerek monte edilecektir"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* FILE UPLOAD */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Fotoğraf Ekle (Opsiyonel)
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
            className="block w-full text-sm text-gray-500"
          />
          <p className="text-xs text-gray-400">
            Mevcut durumun fotoğrafını eklerseniz değerlendirme daha sağlıklı olur.
          </p>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Vazgeç
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className={`rounded-xl px-6 py-2 text-sm font-semibold text-white
              ${
                !isValid || loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            {loading ? "Kaydediliyor…" : "Kaydet ve Devam Et"}
          </button>
        </div>
      </div>
    </div>
  );
}
