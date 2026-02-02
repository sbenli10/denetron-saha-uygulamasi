"use client";

import { useState } from "react";

export default function UploadWordTemplateModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    setError(null);

    if (!name || !version || !file) {
      setError("Tüm alanlar zorunludur.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("version", version);
    formData.append("file", file);

    const res = await fetch(
      "/api/admin/dof-word-templates/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Yükleme başarısız");
      return;
    }

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-5">
        <h2 className="text-lg font-semibold">
          Yeni Word Şablonu Yükle
        </h2>

        <input
          placeholder="Şablon Adı (örn: 2025 Hijyen DÖF)"
          className="w-full border rounded-lg px-3 py-2"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <input
          placeholder="Versiyon (örn: v1.0)"
          className="w-full border rounded-lg px-3 py-2"
          value={version}
          onChange={e => setVersion(e.target.value)}
        />

        <input
          type="file"
          accept=".docx"
          onChange={e =>
            setFile(e.target.files?.[0] ?? null)
          }
        />

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg"
          >
            İptal
          </button>
          <button
            disabled={loading}
            onClick={handleUpload}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg"
          >
            {loading ? "Yükleniyor…" : "Şablonu Yükle"}
          </button>
        </div>
      </div>
    </div>
  );
}
