"use client";

import { useState } from "react";

export default function DofItemEvidenceModal({
  dofItemId,
  onClose,
  onSuccess,
}: {
  dofItemId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(selected: FileList | null) {
    setError(null);

    if (!selected || selected.length === 0) {
      setFiles([]);
      setPreviews([]);
      return;
    }

    const fileArray = Array.from(selected);
    setFiles(fileArray);

    // preview URL’leri
    const previewUrls = fileArray.map(file =>
      URL.createObjectURL(file)
    );
    setPreviews(previewUrls);
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError("Lütfen en az bir dosya seçin.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("dof_item_id", dofItemId);
    formData.append("type", "before");

    files.forEach(file => {
      formData.append("files", file); // 🔥 backend getAll("files")
    });

    const res = await fetch(
      "/api/dof/manual/item/upload-evidence",
      {
        method: "POST",
        body: formData,
      }
    );

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Yükleme başarısız");
      return;
    }

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 space-y-5">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Kanıt Yükle
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* FILE INPUT */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={e =>
            handleFileChange(e.target.files)
          }
        />

        {/* PREVIEWS */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Ön izleme"
                className="h-32 w-full object-cover rounded-lg border"
              />
            ))}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg"
          >
            İptal
          </button>

          <button
            disabled={loading}
            onClick={handleUpload}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg disabled:opacity-60"
          >
            {loading
              ? "Yükleniyor…"
              : `${files.length} Kanıtı Yükle`}
          </button>
        </div>
      </div>
    </div>
  );
}
