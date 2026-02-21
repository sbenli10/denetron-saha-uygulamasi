//APP\app\components\dof\manual\ManualAddItemModal.tsx
"use client";

import { useState, useEffect } from "react";
import { DofItem } from "@/app/admin/dof/manual/[id]/page";

type Props = {
  dofId: string;
  onClose: () => void;
  onSuccess: (newItem: any) => void;
  item?: DofItem;
};

export default function ManualAddItemModal({
  dofId,
  onClose,
  onSuccess,
  item,
}: Props) {
  const isEdit = Boolean(item);

  const [description, setDescription] = useState(item?.risk_description ?? "");
  const [severity, setSeverity] = useState(item?.severity ?? "");
  const [deadline, setDeadline] = useState(item?.deadline ?? "");
  const [area, setArea] = useState(item?.area ?? "");

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  /* ================= FILE HANDLER ================= */

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);

    const previews = selected.map(file => URL.createObjectURL(file));
    setPreviewUrls(previews);
  }

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    if (item) {
      setDescription(item.risk_description ?? "");
      setSeverity(item.severity ?? "");
      setDeadline(item.deadline ?? "");
      setArea(item.area ?? "");
    }
  }, [item]);

  /* ================= AI ANALİZ ================= */

  async function handleAiAnalysis() {
    if (!files.length) {
      alert("AI analiz için en az 1 fotoğraf yükleyin.");
      return;
    }

    setAiLoading(true);

    const formData = new FormData();
    files.forEach(file => formData.append("images", file));

    try {
      const res = await fetch("/api/dof/manual/ai-from-images", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error();

      setDescription(json.risk_description ?? "");
      if (!severity) {
        setSeverity(json.severity_suggestion ?? "");
      }
    } catch {
      alert("AI analiz başarısız.");
    } finally {
      setAiLoading(false);
    }
  }

  /* ================= SUBMIT ================= */

  async function submit() {
    if (!description || !severity || !deadline || !area) {
      alert("Zorunlu alanları doldurunuz.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("dof_id", dofId);
      formData.append("risk_description", description.trim());
      formData.append("severity", severity.trim());
      formData.append("deadline", deadline.trim());
      formData.append("area", area.trim());

      if (isEdit) {
        formData.append("item_id", item!.id);
      }

      files.forEach(file => formData.append("images", file));

      const res = await fetch(
        isEdit
          ? "/api/dof/manual/update-item-with-images"
          : "/api/dof/manual/add-item-with-images",
        {
          method: "POST",
          body: formData,
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error();

      onSuccess(json.item); // 🔥 parent’a new item dön
    } catch {
      alert("İşlem başarısız.");
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "DÖF Maddesini Düzenle" : "Yeni DÖF Maddesi"}
            </h2>
            <p className="text-sm text-gray-500">
              Uygunsuzluk bilgilerini giriniz veya AI ile analiz oluşturunuz
            </p>
          </div>

          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="space-y-6 px-6 py-6 text-sm">

          {/* EXISTING FILES (EDIT MODE) */}
          {isEdit && item?.files && item.files.length > 0 && (
            <div className="space-y-2">
              <label className="font-medium text-gray-700">
                Mevcut Fotoğraflar
              </label>
              <div className="grid grid-cols-3 gap-3">
                {item.files.map(f => (
                  <img
                    key={f.id}
                    src={f.file.url}
                    className="h-24 w-full object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* FOTOĞRAF EKLE */}
          <div className="space-y-3">
            <label className="font-medium text-gray-700">
              {isEdit ? "Yeni Fotoğraf Ekle" : "Fotoğraflar (Opsiyonel)"}
            </label>

            <label
              className="flex flex-col items-center justify-center w-full cursor-pointer
                        rounded-xl border-2 border-dashed border-gray-300
                        bg-gray-50 hover:bg-gray-100 transition
                        px-6 py-8 text-center"
            >
              <div className="flex flex-col items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                  />
                </svg>

                <span className="text-sm font-medium text-gray-700">
                  Fotoğraf yüklemek için tıklayın
                </span>

                <span className="text-xs text-gray-500">
                  PNG, JPG, JPEG — Çoklu seçim desteklenir
                </span>

                {files.length > 0 && (
                  <span className="text-xs text-indigo-600 font-medium mt-1">
                    {files.length} dosya seçildi
                  </span>
                )}
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* PREVIEW */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previewUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative group rounded-lg overflow-hidden border"
                  >
                    <img
                      src={url}
                      className="h-24 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...files];
                        newFiles.splice(i, 1);
                        setFiles(newFiles);

                        const newPreviews = [...previewUrls];
                        newPreviews.splice(i, 1);
                        setPreviewUrls(newPreviews);
                      }}
                      className="absolute top-1 right-1 hidden group-hover:flex
                                items-center justify-center
                                h-6 w-6 rounded-full bg-black/60 text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isEdit && (
              <button
                type="button"
                disabled={files.length === 0 || aiLoading}
                onClick={handleAiAnalysis}
                className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {aiLoading
                  ? "Analiz Ediliyor..."
                  : "🤖 Yapay Zeka ile Risk Analizi Oluştur"}
              </button>
            )}
          </div>

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

          {/* META */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="font-medium text-gray-700">
                Önem Seviyesi <span className="text-red-500">*</span>
              </label>
              <input
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="font-medium text-gray-700">
                Termin <span className="text-red-500">*</span>
              </label>
              <input
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-medium text-gray-700">
                İlgili Bölüm <span className="text-red-500">*</span>
              </label>
              <input
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
          >
            İptal
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}