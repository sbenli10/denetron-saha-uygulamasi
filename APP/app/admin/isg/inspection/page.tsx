//APP\app\admin\isg\inspection\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, X, AlertTriangle } from "lucide-react";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_SIZE_MB = 15;

export default function InspectionDocumentUploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validateFile(file: File): boolean {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        "PDF, fotoğraf, Excel (.xls/.xlsx) veya Word (.doc/.docx) dosyası yükleyebilirsiniz."
      );
      return false;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Dosya boyutu ${MAX_SIZE_MB} MB’dan büyük olamaz.`);
      return false;
    }

    setError(null);
    return true;
  }

  function handleFile(file: File) {
    if (!validateFile(file)) return;
    setFile(file);
  }

  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/isg/analyze/inspection", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("UPLOAD_FAILED");
      }

      const data = await res.json();
      sessionStorage.setItem("isg_result", JSON.stringify(data));
      router.push("/admin/isg/result");
    } catch {
      setError("Denetim belgesi analiz edilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-20 space-y-10 text-gray-900">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Denetim Tutanağı Yükle</h1>
        <p className="text-gray-600">
          Denetim sırasında oluşturulan tutanak veya raporu yükleyin.
          Sistem tespitleri ayırarak değerlendirme raporu üretir.
        </p>
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragActive(false);
          const droppedFile = e.dataTransfer.files?.[0];
          if (droppedFile) handleFile(droppedFile);
        }}
        className={`rounded-2xl border-2 border-dashed px-8 py-14 text-center transition ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <UploadCloud className="mx-auto mb-4 text-gray-400" size={40} />

        <label className="cursor-pointer block space-y-2">
          <p className="font-medium">Denetim belgesini yükleyin</p>
          <p className="text-sm text-gray-500">
            PDF, fotoğraf, Excel veya Word
          </p>
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {file && (
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={() => setFile(null)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <button
        disabled={!file || loading}
        onClick={handleUpload}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium disabled:opacity-40"
      >
        {loading ? "Denetim Analiz Ediliyor…" : "Denetimi Başlat"}
      </button>
    </div>
  );
}
