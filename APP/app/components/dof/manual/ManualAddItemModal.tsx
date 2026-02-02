"use client";

import { useState } from "react";
import { DofItem } from "@/app/admin/dof/manual/[id]/page";

type Props = {
  dofId: string;
  onClose: () => void;
  onSuccess: () => void;
  item?: DofItem;
};

export default function ManualAddItemModal({
  dofId,
  onClose,
  onSuccess,
  item,
}: Props) {
  const [description, setDescription] = useState(item?.risk_description ?? "");
  const [actionDescription, setActionDescription] = useState(
    item?.action_description ?? ""
  );
  const [longDescription, setLongDescription] = useState(
    item?.long_description ?? ""
  );
  const [severity, setSeverity] = useState(item?.severity ?? "");
  const [deadline, setDeadline] = useState(item?.deadline ?? "");
  const [area, setArea] = useState(item?.area ?? "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!description || !severity || !deadline || !area) {
      alert("Zorunlu alanları doldurunuz.");
      return;
    }

    setLoading(true);

    const res = await fetch(
      item ? "/api/dof/manual/update-item" : "/api/dof/manual/add-item",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item?.id,
          dof_id: dofId,
          risk_description: description,
          action_description: actionDescription,
          long_description: longDescription,
          severity,
          deadline,
          area,
        }),
      }
    );

    setLoading(false);

    if (!res.ok) {
      alert("İşlem başarısız");
      return;
    }

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {item ? "DÖF Maddesini Düzenle" : "Yeni DÖF Maddesi"}
            </h2>
            <p className="text-sm text-gray-500">
              Tespit edilen uygunsuzluk ve planlanan faaliyet bilgilerini giriniz
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-6 px-6 py-6 text-sm">

          {/* RISK */}
          <div className="space-y-1">
            <label className="font-medium text-gray-700">
              Risk / Uygunsuzluk Açıklaması
              <span className="text-red-500"> *</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

        
          {/* <div className="space-y-1">
            <label className="font-medium text-gray-700">
              Planlanan Faaliyet
            </label>
            <textarea
              rows={3}
              value={actionDescription}
              onChange={e => setActionDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div> */}
          {/* META GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-1">
              <label className="font-medium text-gray-700">
                Önem Seviyesi
                <span className="text-red-500"> *</span>
              </label>
              <input
                placeholder="Örn: Yüksek, Orta, Kritik"
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-gray-700">
                Termin
                <span className="text-red-500"> *</span>
              </label>
              <input
                placeholder="Örn: 15 gün / Acil / 30.09.2026"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-medium text-gray-700">
                İlgili Bölüm
                <span className="text-red-500"> *</span>
              </label>
              <input
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2
                           focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            İptal
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg
                       bg-blue-600 px-6 py-2 text-sm font-semibold text-white
                       transition hover:bg-blue-700 active:scale-[0.97]
                       disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
