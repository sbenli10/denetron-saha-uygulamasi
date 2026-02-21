"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle, 
  RefreshCcw,
  Camera,
  Info
} from "lucide-react";

/* ---------------- TYPES ---------------- */

interface PreviewFile {
  file: File;
  preview: string;
}

interface AnalysisNotice {
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

/* ---------------- PAGE ---------------- */

export default function InspectionPhotoUploadPage() {
  const router = useRouter();

  // States
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTime, setLoadingTime] = useState<number>(0);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [notice, setNotice] = useState<AnalysisNotice | null>(null);

  // Analiz süresini takip eden Timer
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

  // Sayfadan çıkıldığında tüm önizleme URL'lerini temizle (Memory Leak Önleme)
  // ✅ Sadece sayfadan tamamen çıkıldığında (unmount) temizlik yap
  useEffect(() => {
    return () => {
      // Bu kısım sadece sayfa kapandığında çalışır
      // State içindeki o anki dosyalara erişmek için bir referans veya o anki files kullanılır
      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Bağımlılık dizisini boş bırakıyoruz!

  /* ---------------- DİNAMİK MESAJ YÖNETİMİ ---------------- */
  const getLoadingMessage = () => {
    if (loadingTime < 6) return "Fotoğraflar yapay zekaya aktarılıyor...";
    if (loadingTime < 15) return "Görüntü işleme ile riskli durumlar tespit ediliyor...";
    if (loadingTime < 25) return "Mevzuat ihlalleri ve düzeltici öneriler hazırlanıyor...";
    return "Analiz sonuçlandırılıyor, lütfen bekleyin...";
  };

  /* ---------------- HANDLERS ---------------- */

  const addFiles = useCallback((selected: FileList | File[]) => {
    const arr = Array.from(selected);
    const images = arr.filter((file) => file.type.startsWith("image/"));

    if (images.length === 0) {
      setNotice({ 
        title: "Hatalı Format", 
        message: "Lütfen sadece fotoğraf dosyaları (JPG, PNG) yükleyin.", 
        type: "error" 
      });
      return;
    }

    const mapped: PreviewFile[] = images.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...mapped]);
  }, []);

  const removeFile = (index: number) => {
    const target = files[index];
    if (target?.preview) URL.revokeObjectURL(target.preview);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || loading) return;

    setLoading(true);
    setNotice(null);

    // Önizlemeleri sonuç sayfasında göstermek için sakla
    const previews = files.map((f) => ({
      name: f.file.name,
      preview: f.preview,
    }));
    sessionStorage.setItem("isg_photo_previews", JSON.stringify(previews));

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f.file));

    try {
      const res = await fetch("/api/admin/isg/analyze/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 504 || res.status === 503) throw new Error("TIMEOUT");
        throw new Error(data?.error?.message || data?.message || "Analiz başarısız oldu.");
      }

      if (!data?.success) {
        throw new Error(data?.error?.message || "Görüntü analiz edilemedi.");
      }

      // Başarılı: Veriyi sakla ve yönlendir
      sessionStorage.setItem("isg_result", JSON.stringify(data));
      router.push("/admin/isg/result");

    } catch (err: any) {
      console.error("PHOTO_ANALYZE_ERROR", err);
      setNotice({
        title: "Analiz Hatası",
        message: err.message === "TIMEOUT" 
          ? "Görüntü analizi sunucu limitlerini aştı. Lütfen daha az fotoğraf ile deneyin." 
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
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Camera className="text-blue-600" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Sahadan Fotoğraf Analizi</h1>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Sahadaki çalışma ortamı görsellerini yükleyin. Yapay zekâ, güvenli olmayan 
          durumları (KÖD) ve kişisel koruyucu donanım ihlallerini tespit eder.
        </p>
      </header>

      {/* LOADING STATE */}
      {loading && (
        <div className="rounded-2xl border-2 border-blue-100 bg-white p-10 text-center space-y-6 shadow-xl animate-in fade-in duration-500">
          <Loader2 size={48} className="mx-auto text-blue-600 animate-spin" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-800">{getLoadingMessage()}</p>
            <p className="text-sm text-slate-400">Analiz süresi: {loadingTime}s</p>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full transition-all duration-700 ease-out" 
              style={{ width: `${Math.min(loadingTime * 4, 98)}%` }}
            />
          </div>
        </div>
      )}

      {/* ERROR / NOTICE STATE */}
      {notice && !loading && (
        <div className={`rounded-2xl border p-6 space-y-4 animate-in zoom-in duration-300 ${
          notice.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle size={24} />
            <h3 className="font-bold text-lg">{notice.title}</h3>
          </div>
          <p className="text-sm leading-relaxed">{notice.message}</p>
          <button 
            onClick={() => setNotice(null)}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg transition-colors border ${
              notice.type === "error" ? "text-red-800 border-red-200 hover:bg-red-100" : "text-blue-800 border-blue-200 hover:bg-blue-100"
            }`}
          >
            <RefreshCcw size={14} /> Kapat ve Tekrar Dene
          </button>
        </div>
      )}

      {/* UPLOAD FORM */}
      {!loading && !notice && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
            className={`
              rounded-2xl border-2 border-dashed px-8 py-14 text-center transition group
              ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-blue-400"}
            `}
          >
            <UploadCloud className={`mx-auto mb-4 transition-colors ${dragActive ? "text-blue-500" : "text-gray-400 group-hover:text-blue-400"}`} size={44} />

            <label className="cursor-pointer block space-y-3">
              <p className="text-lg font-medium text-slate-700">Fotoğrafları sürükleyin veya seçin</p>
              <p className="text-sm text-gray-500">Analiz için en az bir fotoğraf gereklidir (JPG / PNG)</p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
              />
            </label>
          </div>

          {/* PREVIEWS GRID */}
          {files.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {files.map((f, i) => (
                <div key={i} className="group relative rounded-xl overflow-hidden border bg-white aspect-square shadow-sm animate-in zoom-in duration-300">
                  <img
                    src={f.preview}
                    alt={f.file.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removeFile(i)}
                      className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 backdrop-blur-sm">
                    <p className="text-[10px] text-white truncate">{f.file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            disabled={files.length === 0 || loading}
            onClick={handleUpload}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Analizi Başlat ({files.length} Fotoğraf)
          </button>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="flex gap-3 rounded-2xl border bg-slate-50 p-4 text-xs text-slate-500">
      <Info size={18} className="text-slate-400 shrink-0" />
      <div className="space-y-1">
        <p className="leading-relaxed">
          <strong>İSG Notu:</strong> Yapay zeka analizi bir yardımcı denetim aracıdır.
        </p>
        <p className="text-amber-600 font-medium">
          ⚠️ Önemli: Analiz süresi, yüklediğiniz fotoğraf sayısına ve çözünürlüğüne bağlı olarak artış gösterebilir.
        </p>
      </div>
    </div>
    </div>
  );
}