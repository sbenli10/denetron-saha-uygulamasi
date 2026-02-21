"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  RefreshCcw,
  LucideIcon,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

interface UploadedFile {
  file: File;
  previewUrl?: string;
}

interface AnalysisError {
  title: string;
  message: string;
}

/* ---------------- PAGE ---------------- */

export default function TrainingUploadPage() {
  const router = useRouter();

  // States
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTime, setLoadingTime] = useState<number>(0);
  const [error, setError] = useState<AnalysisError | null>(null);

  // Analiz süresini sayacak olan Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  /* ---------------- VALIDATION ---------------- */

  const validateFile = useCallback((file: File): boolean => {
    const allowedTypes = [
      "application/pdf",
      "image/",
      "application/vnd.openxmlformats-officedocument",
      "application/vnd.ms-excel",
      "application/msword",
    ];

    const isAllowed = allowedTypes.some((type) => file.type.startsWith(type));

    if (!isAllowed) {
      setError({
        title: "Desteklenmeyen Format",
        message: "Lütfen sadece PDF, Word, Excel veya Görsel (JPG/PNG) yükleyin.",
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError({
        title: "Dosya Çok Büyük",
        message: "Dosya boyutu 10 MB sınırını aşamaz.",
      });
      return false;
    }

    return true;
  }, []);

  /* ---------------- HANDLERS ---------------- */

  const handleFiles = useCallback((selected: File[]) => {
    setError(null);
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
  }, [validateFile]);

  const removeFile = (index: number) => {
    const item = files[index];
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File): React.ReactElement => {
    if (file.type.startsWith("image/")) return <FileImage className="text-indigo-500" />;
    if (file.type === "application/pdf") return <FileText className="text-red-500" />;
    if (file.type.includes("spreadsheet") || file.type.includes("excel")) {
      return <FileSpreadsheet className="text-green-600" />;
    }
    return <File className="text-gray-400" />;
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((item) => {
        formData.append("files", item.file);
      });

      const response = await fetch("/api/admin/isg/analyze/training", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Analiz işlemi başarısız oldu.");
      }

      const result = await response.json();

      // Browser ortamı kontrolü
      if (typeof window !== "undefined") {
        sessionStorage.setItem("isg_training_result", JSON.stringify(result));
        router.push("/admin/isg/training/result");
      }
    } catch (err: any) {
      console.error("[ISG_TRAINING_ANALYZE_ERROR]", err);
      setError({
        title: "Analiz Hatası",
        message: err.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-16 text-gray-900">
      <div className="max-w-xl mx-auto space-y-10">
        
        {/* HEADER */}
        <header className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-indigo-100 shadow-sm">
              <GraduationCap size={36} className="text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-slate-800">Eğitim Planı Analizi</h1>
          <p className="text-slate-500 leading-relaxed">
            Belgeleri yükleyin, sistem <strong>geçerliliği ve mevzuat uyumunu</strong> analiz etsin.
          </p>
        </header>

        {/* LOADING STATE */}
        {loading && (
          <div className="rounded-2xl border-2 border-indigo-100 bg-white p-10 text-center space-y-6 shadow-xl animate-in fade-in duration-500">
            <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-slate-800">
                {loadingTime < 7 ? "Belgeler taranıyor..." : 
                 loadingTime < 15 ? "Mevzuat uyumluluğu denetleniyor..." : 
                 "Rapor oluşturuluyor, lütfen bekleyin..."}
              </p>
              <p className="text-sm text-slate-400">Analiz süresi: {loadingTime}s</p>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-700 ease-out" 
                style={{ width: `${Math.min(loadingTime * 4, 98)}%` }}
              />
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-4 animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle size={24} />
              <h3 className="font-bold text-lg">{error.title}</h3>
            </div>
            <p className="text-sm text-red-700 leading-relaxed">{error.message}</p>
            <button 
              onClick={() => setError(null)}
              className="flex items-center gap-2 text-sm font-bold text-red-800 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-200"
            >
              <RefreshCcw size={14} /> Tekrar Dene
            </button>
          </div>
        )}

        {/* UPLOAD FORM */}
        {!loading && !error && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex gap-3 rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
              <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
              <p>Çoklu belge yükleyerek çapraz kontrol yaptırabilirsiniz (Plan + Katılım Listesi Fotoğrafı vb.).</p>
            </div>

            <div
              className="rounded-2xl border-2 border-dashed bg-white p-10 text-center hover:border-indigo-400 transition-colors cursor-pointer group"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(Array.from(e.dataTransfer.files));
              }}
            >
              <label className="cursor-pointer block">
                <UploadCloud size={40} className="mx-auto mb-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <p className="text-sm font-semibold text-slate-700">Dosyaları buraya bırakın veya tıklayın</p>
                <p className="text-xs text-slate-400 mt-2">PDF, Word, Excel, Görsel • Maks. 10 MB</p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                />
              </label>
            </div>

            {/* PREVIEW */}
            {files.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {files.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt="önizleme" className="h-10 w-10 rounded object-cover" />
                      ) : getFileIcon(item.file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-400">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button 
                      onClick={() => removeFile(i)} 
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={files.length === 0}
              className="w-full rounded-2xl bg-indigo-600 py-4 text-white text-lg font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Analizi Başlat
            </button>
          </div>
        )}

        <footer className="text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            Bu analiz yapay zeka destekli bir ön değerlendirmedir. Nihai yasal sorumluluk İSG profesyonellerine aittir.
          </p>
        </footer>
      </div>
    </div>
  );
}