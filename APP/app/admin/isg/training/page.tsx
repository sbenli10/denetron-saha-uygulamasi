// APP/app/admin/isg/training/page.tsx

"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  UploadCloud,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  X,
  Info,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type UploadedFile = {
  file: File;
  previewUrl?: string;
  pdfPreview?: string;
};

/* ---------------- PAGE ---------------- */

export default function TrainingUploadPage() {
  const router = useRouter();

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- VALIDATION ---------------- */

  const allowedTypes = [
    "application/pdf",
    "image/",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel",
    "application/msword",
  ];

  function validateFile(file: File) {
    const isAllowed = allowedTypes.some((type) =>
      file.type.startsWith(type)
    );

    if (!isAllowed) {
      setError(
        "Desteklenen dosya türleri: PDF, Word, Excel veya görsel dosyalar."
      );
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Dosya boyutu 10 MB'dan büyük olamaz.");
      return false;
    }

    return true;
  }
  /* ---------------- FILE HANDLER ---------------- */

  async function handleFiles(selected: File[]) {
    const prepared: UploadedFile[] = [];

    for (const file of selected) {
      if (!validateFile(file)) continue;

      const entry: UploadedFile = { file };

      if (file.type.startsWith("image/")) {
        entry.previewUrl = URL.createObjectURL(file);
      }
      prepared.push(entry);
    }

    setFiles((prev) => [...prev, ...prepared]);
    setError(null);
  }

  function removeFile(index: number) {
    const item = files[index];
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);

    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  /* ---------------- ICON ---------------- */

  function getFileIcon(file: File) {
    if (file.type.startsWith("image/"))
      return <FileImage className="text-indigo-500" />;

    if (file.type === "application/pdf")
      return <FileText className="text-red-500" />;

    if (
      file.type.includes("spreadsheet") ||
      file.type.includes("excel")
    )
      return <FileSpreadsheet className="text-green-600" />;

    return <File className="text-gray-400" />;
  }

  /* ---------------- ANALYZE ---------------- */

  async function handleAnalyze() {
    if (!files.length) return;

    setLoading(true);
    setError(null);

    try {
      // 1️⃣ FormData hazırla
      const formData = new FormData();
      files.forEach((item) => {
        formData.append("files", item.file);
      });

      // 2️⃣ API çağrısı
      const response = await fetch("/api/admin/isg/analyze/training", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Analiz sırasında hata oluştu.");
      }

      // 3️⃣ API sonucu al
      const result = await response.json();

      // 4️⃣ Result sayfası için sakla
      sessionStorage.setItem(
        "isg_training_result",
        JSON.stringify(result)
      );

      // 5️⃣ Sonuç ekranına yönlendir
      router.push("/admin/isg/training/result");

    } catch (err: any) {
      console.error("[ISG_TRAINING_ANALYZE_ERROR]", err);
      setError(err.message || "Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-16 text-gray-900">
      <div className="max-w-xl mx-auto space-y-10">

        {/* HEADER */}
        <header className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-indigo-100">
              <GraduationCap size={36} className="text-indigo-600" />
            </div>
          </div>

          <h1 className="text-3xl font-semibold">Eğitim Planı Analizi</h1>

          <p className="text-gray-600 leading-relaxed">
            Eğitim katılım listesi veya eğitim planı belgesini yükleyin.
            Sistem, eğitimlerin{" "}
            <strong>geçerliliğini ve süre durumunu</strong> analiz eder.
          </p>
        </header>

        {/* INFO */}
        <div className="flex gap-3 rounded-2xl border bg-white p-4 text-sm text-gray-600">
          <Info size={18} className="text-indigo-500 mt-0.5" />
          <div>
            <p className="font-medium text-gray-800">
              Yükleyebileceğiniz belge türleri:
            </p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Eğitim katılım listeleri</li>
              <li>Eğitim planları ve çizelgeleri</li>
              <li>Sertifikalar ve resmi dökümanlar</li>
              <li>PDF, Word, Excel, Görsel veya diğer belge formatları</li>
            </ul>
          </div>
        </div>

        {/* UPLOAD */}
        <div
          className="rounded-2xl border-2 border-dashed bg-white p-10 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <label className="cursor-pointer block">
            <UploadCloud size={36} className="mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Belgeleri sürükleyin veya tıklayarak seçin
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Desteklenenler: PDF, Word, Excel, Görsel • Maks. 10 MB
            </p>

            <input
              type="file"
              multiple
              accept="*"
              className="hidden"
              onChange={(e) =>
                handleFiles(Array.from(e.target.files || []))
              }
            />
          </label>
        </div>

        {/* PREVIEW GRID */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {files.map((item, i) => (
              <div
                key={i}
                className="rounded-xl border bg-white p-4"
              >
                <div className="flex items-center gap-3">
                  {item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : item.pdfPreview ? (
                    <img
                      src={item.pdfPreview}
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-gray-100 rounded">
                      {getFileIcon(item.file)}
                    </div>
                  )}

                  <div className="text-sm flex-1">
                    <p className="font-medium break-all">
                      {item.file.name}
                    </p>
                    <p className="text-gray-500">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    onClick={() => removeFile(i)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* ACTION */}
        <button
          onClick={handleAnalyze}
          disabled={!files.length || loading}
          className="w-full rounded-xl bg-indigo-600 py-4 text-white text-lg font-semibold transition hover:bg-indigo-700 disabled:opacity-40"
        >
          {loading
            ? "Eğitim Durumu Analiz Ediliyor…"
            : "Eğitim Analizini Başlat"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Bu analiz ön değerlendirme amaçlıdır. Nihai sorumluluk İSG
          uzmanına aittir.
        </p>
      </div>
    </div>
  );
}
