//APP\app\admin\isg\risk-analysis\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  X,
  FileSpreadsheet,
} from "lucide-react";

type SelectedFile = {
  file: File;
};

type NoticeType = "success" | "error" | "warning" | "info";

type Notice = {
  message: string;
  type: NoticeType;
};


export default function RiskAnalysisUploadPage() {
  const router = useRouter();

  const [file, setFile] = useState<SelectedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [dragActive, setDragActive] = useState(false);
  
  function showNotice(
    message: string,
    type: NoticeType = "info",
    duration = 5000
  ) {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), duration);
  }


  function validateFile(selected: File) {
    if (
      !selected.name.endsWith(".xls") &&
      !selected.name.endsWith(".xlsx")
    ) {
      showNotice("Sadece Excel (.xls, .xlsx) dosyası yükleyebilirsiniz");
      return false;
    }
    return true;
  }

  function handleFileSelect(selected: File) {
    if (!validateFile(selected)) return;
    setFile({ file: selected });
    showNotice("Risk analizi dosyası eklendi");
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function removeFile() {
    setFile(null);
  }

 async function handleUpload() {
  if (!file) {
    showNotice(
      "Lütfen analiz etmek istediğiniz risk analizi Excel dosyasını seçin.",
      "warning"
    );
    return;
  }

  if (loading) return;

  setLoading(true);
  showNotice(
    "Risk analizi dosyası işleniyor. Bu işlem birkaç saniye sürebilir...",
    "info",
    5000
  );

  const formData = new FormData();
  formData.append("file", file.file);

  try {
    const res = await fetch("/api/admin/isg/analyze/risk-analysis", {
      method: "POST",
      body: formData,
    });

    let data: any = null;

    try {
      data = await res.json();
    } catch {
      // JSON parse edilemezse sessiz geç
    }

    /* ================================
       HTTP STATUS BAZLI GERİ BİLDİRİM
    ================================= */

    if (!res.ok) {
      const backendMessage =
        data?.error?.message ||
        "Risk analizi sırasında beklenmeyen bir hata oluştu.";

      switch (res.status) {
        case 400:
          showNotice(
            backendMessage ||
              "Yüklenen dosya geçersiz. Lütfen Excel formatında (.xls, .xlsx) bir dosya seçin.",
            "error"
          );
          break;

        case 403:
          showNotice(
            "Bu özellik premium üyelik gerektirir. Lütfen planınızı yükseltin.",
            "warning"
          );
          break;

        case 422:
          showNotice(
            "Excel dosyası okunamadı. Dosya bozuk, şifreli veya desteklenmeyen formatta olabilir.",
            "error"
          );
          break;

        case 429:
          showNotice(
            data?.error?.code === "AI_QUOTA_EXCEEDED"
              ? "Yapay zekâ kullanım limitiniz doldu. Lütfen daha sonra tekrar deneyin."
              : "Sistem şu anda yoğun. Lütfen birkaç dakika sonra tekrar deneyin.",
            "warning"
          );
          break;

        case 504:
          showNotice(
            "Yapay zekâ yorumu zaman aşımına uğradı. Risk skorları hesaplandı ancak detaylı mevzuat analizi oluşturulamadı.",
            "warning",
            6000
          );
          break;

        default:
          showNotice(backendMessage, "error");
      }

      return;
    }

    /* ================================
       BAŞARILI RESPONSE KONTROLÜ
    ================================= */

    if (!data?.success) {
      showNotice(
        data?.error?.message ||
          "Risk analizi tamamlanamadı. Lütfen dosyanızı kontrol edin.",
        "error"
      );
      return;
    }

    /* ================================
       WARNINGS VARSA BİLGİLENDİR
    ================================= */

    if (data?.warnings?.length) {
      showNotice(
        "Analiz tamamlandı ancak bazı uyarılar mevcut. Detayları sonuç sayfasında inceleyebilirsiniz.",
        "warning",
        6000
      );
    } else {
      showNotice("Risk analizi başarıyla tamamlandı.", "success");
    }

    /* ================================
       SONUÇ SAYFASINA YÖNLENDİR
    ================================= */

    sessionStorage.setItem(
      "risk_analysis_result",
      JSON.stringify(data)
    );

    router.push("/admin/isg/risk-analysis/result");

  } catch (err) {
    console.error("RISK_ANALYSIS_NETWORK_ERROR", err);

    showNotice(
      "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin ve tekrar deneyin.",
      "error",
      6000
    );
  } finally {
    setLoading(false);
  }
}


  return (
    <div className="max-w-2xl mx-auto py-16 px-4 space-y-10 text-gray-900">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">
          Risk Analizi (Fine–Kinney) Yükleme
        </h1>
        <p className="text-gray-600">
          Excel formatındaki risk analizi dosyanızı sürükleyin
          veya seçin. Yapay zekâ risk skorlarını ve mevzuat
          uyumluluğunu analiz eder.
        </p>
      </header>

      {/* DROP ZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`
          rounded-2xl border-2 border-dashed px-8 py-14 text-center transition
          ${
            dragActive
              ? "border-green-600 bg-green-50"
              : "border-gray-300 bg-gray-50"
          }
        `}
      >
        <UploadCloud className="mx-auto mb-4 text-gray-400" size={40} />

        <label className="cursor-pointer block space-y-2">
          <p className="font-medium">
            Excel dosyasını sürükleyin veya seçin
          </p>
          <p className="text-sm text-gray-500">
            .xls veya .xlsx formatı desteklenir
          </p>
          <input
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>

      {/* SELECTED FILE */}
      {file && (
        <div className="relative rounded-xl border bg-white p-4 shadow-sm flex items-center gap-4">
          <FileSpreadsheet
            className="text-green-600"
            size={28}
          />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {file.file.name}
            </p>
            <p className="text-xs text-gray-500">
              Risk analizi dosyası
            </p>
          </div>
          <button
            onClick={removeFile}
            className="rounded-md bg-gray-100 p-2 hover:bg-gray-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUBMIT */}
      <button
        disabled={!file || loading}
        onClick={handleUpload}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium disabled:opacity-40"
      >
        {loading
          ? "Risk Analizi Değerlendiriliyor..."
          : "Analizi Başlat"}
      </button>

      {notice && (
        <div
            className={`fixed bottom-6 right-6 rounded-xl px-5 py-3 text-sm shadow-xl text-white
            ${
                notice.type === "error"
                ? "bg-red-600"
                : notice.type === "success"
                ? "bg-green-600"
                : notice.type === "warning"
                ? "bg-yellow-600"
                : "bg-gray-900"
            }`}
        >
            {notice.message}
        </div>
        )}

    </div>
  );
}
