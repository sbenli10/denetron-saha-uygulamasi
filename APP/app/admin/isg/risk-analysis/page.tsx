"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  X,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

interface AnalysisNotice {
  title: string;
  message: string;
  type: "error" | "warning" | "success" | "info";
}

/* ---------------- PAGE ---------------- */

export default function RiskAnalysisUploadPage() {
  const router = useRouter();

  // States
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTime, setLoadingTime] = useState<number>(0);
  const [error, setError] = useState<AnalysisNotice | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

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

  /* ---------------- DİNAMİK MESAJ YÖNETİMİ ---------------- */
  const getLoadingMessage = () => {
    if (loadingTime < 6) return "Excel dosyası okunuyor ve veriler ayrıştırılıyor...";
    if (loadingTime < 15) return "Yapay zeka Fine-Kinney skorlarını hesaplıyor...";
    if (loadingTime < 25) return "Mevzuat uyumluluğu ve düzeltici faaliyetler oluşturuluyor...";
    return "Analiz tamamlanmak üzere, lütfen sayfayı kapatmayın...";
  };

  /* ---------------- VALIDATION ---------------- */

  const validateFile = useCallback((selected: File): boolean => {
    const isExcel = 
      selected.name.endsWith(".xls") || 
      selected.name.endsWith(".xlsx") ||
      selected.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      selected.type === "application/vnd.ms-excel";

    if (!isExcel) {
      setError({
        title: "Geçersiz Dosya Formatı",
        message: "Sadece Excel (.xls, .xlsx) dosyaları analiz edilebilir.",
        type: "error"
      });
      return false;
    }

    if (selected.size > 15 * 1024 * 1024) {
      setError({
        title: "Dosya Çok Büyük",
        message: "Risk analizi dosyası 15 MB sınırını aşamaz.",
        type: "error"
      });
      return false;
    }

    return true;
  }, []);

  /* ---------------- HANDLERS ---------------- */

  const handleFileSelect = (selected: File) => {
    setError(null);
    if (!validateFile(selected)) return;
    setFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/isg/analyze/risk-analysis", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 504 || res.status === 503) throw new Error("TIMEOUT");
        throw new Error(data?.error?.message || "Analiz sırasında bir hata oluştu.");
      }

      if (!data?.success) {
        throw new Error(data?.error?.message || "Analiz tamamlanamadı.");
      }

      // Başarılı: Veriyi sakla ve yönlendir
      if (typeof window !== "undefined") {
        sessionStorage.setItem("risk_analysis_result", JSON.stringify(data));
        router.push("/admin/isg/risk-analysis/result");
      }

    } catch (err: any) {
      console.error("RISK_ANALYSIS_ERROR", err);
      setError({
        title: "Analiz Başarısız",
        message: err.message === "TIMEOUT" 
          ? "Sunucu zaman aşımına uğradı. Dosyanız çok büyükse lütfen parçalara bölerek deneyin." 
          : err.message,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-4 space-y-10 text-gray-900">
      
      {/* HEADER */}
      <header className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-slate-800">
          Risk Analizi (Fine–Kinney) Analizörü
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Excel formatındaki risk analizinizi yükleyin. Yapay zekâ skorları doğrular, 
          yasal mevzuat uyumunu denetler ve iyileştirme önerileri sunar.
        </p>
      </header>

      {/* LOADING STATE */}
      {loading && (
        <div className="rounded-2xl border-2 border-green-100 bg-white p-10 text-center space-y-6 shadow-xl animate-in fade-in duration-500">
          <Loader2 size={48} className="mx-auto text-green-600 animate-spin" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-800">{getLoadingMessage()}</p>
            <p className="text-sm text-slate-400">Geçen süre: {loadingTime}s</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-600 h-full transition-all duration-700 ease-out" 
              style={{ width: `${Math.min(loadingTime * 3.5, 96)}%` }}
            />
          </div>
        </div>
      )}

      {/* ERROR / FALLBACK STATE */}
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
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`
              rounded-2xl border-2 border-dashed px-8 py-14 text-center transition group
              ${dragActive ? "border-green-600 bg-green-50" : "border-gray-300 bg-gray-50 hover:border-green-400"}
            `}
          >
            <UploadCloud className={`mx-auto mb-4 transition-colors ${dragActive ? "text-green-600" : "text-gray-400 group-hover:text-green-500"}`} size={44} />

            <label className="cursor-pointer block space-y-3">
              <p className="text-lg font-medium text-slate-700">
                Risk analizi dosyasını sürükleyin veya seçin
              </p>
              <p className="text-sm text-gray-500">
                Sadece .xls veya .xlsx formatları desteklenir (Maks. 15MB)
              </p>
              <input
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
              />
            </label>
          </div>

          {/* SELECTED FILE PREVIEW */}
          {file && (
            <div className="relative rounded-xl border-2 border-green-100 bg-white p-5 shadow-sm flex items-center gap-4 animate-in slide-in-from-left-2">
              <div className="p-3 bg-green-50 rounded-lg">
                <FileSpreadsheet className="text-green-600" size={32} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Analize Hazır
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            disabled={!file || loading}
            onClick={handleUpload}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg font-bold shadow-lg shadow-green-100 hover:shadow-green-200 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            {file ? "Analizi Başlat" : "Lütfen Dosya Seçin"}
          </button>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="text-blue-600 shrink-0" size={20} />
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Güvenlik Notu:</strong> Yüklediğiniz veriler sadece analiz amaçlı kullanılır ve 
          İSG yönetmelikleri kapsamında gizli tutulur. Analiz sonuçları uzman görüşü yerine geçmez, 
          karar destek mekanizması olarak tasarlanmıştır.
        </p>
      </div>

    </div>
  );
}