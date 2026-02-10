//APP\app\admin\premium\ocr\create\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useOCRStore } from "@/app/admin/templates/ocr/ocrStore";
import AILoader from "@/app/components/premium-ocr/AILoader";

export default function PremiumOCRCreatePage() {
  const router = useRouter();
  const setAll = useOCRStore((s) => s.setAll);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
  }

  function handleFile(file: File) {
    setFile(file);
    showNotice("Dosya yüklendi");
  }

  function removeFile() {
    setFile(null);
    showNotice("Dosya kaldırıldı");
  }

    function onDrop(e: DragEvent<HTMLDivElement>) {
      e.preventDefault();
      setDragActive(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) handleFile(dropped);
    }

    function handleErrorCode(error?: string) {
    switch (error) {
      case "AI_TEMPORARILY_BUSY":
        showNotice(
          "AI servisleri şu anda yoğun. Lütfen birkaç dakika sonra tekrar deneyin."
        );
        break;

      case "PREMIUM_REQUIRED":
        showNotice("Bu özellik yalnızca Premium kullanıcılar içindir.");
        break;

      default:
        showNotice("İşlem sırasında bir sorun oluştu.");
    }
  }


  async function handleUpload() {
    if (!file) return;

    setLoading(true);
    showNotice("Belge analiz ediliyor…");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/templates/ocr-extract", {
        method: "POST",
        body: formData,
      });

      let data: any = null;

      try {
        data = await res.json();
      } catch {
        // JSON bile gelmediyse
        showNotice("Sunucudan geçersiz yanıt alındı.");
        return;
      }

      // 🔴 1) HTTP başarısızsa → DUR
      if (!res.ok) {
        handleErrorCode(data?.error);
        return;
      }

      // 🔴 2) Backend açıkça başarısız diyorsa → DUR
      if (data.success === false) {
        handleErrorCode(data.error);
        return;
      }

      // 🔴 3) Beklenen alanlar yoksa → DUR
      if (!data.template || !data.ocr_clean) {
        showNotice("Şablon oluşturulamadı. Lütfen tekrar deneyin.");
        return;
      }

      // ✅ SADECE BURAYA GELİRSE BAŞARILI
      setAll({
        ocr_raw: data.ocr_raw ?? "",
        ocr_clean: data.ocr_clean,
        template: data.template,
      });

      showNotice("Şablon başarıyla oluşturuldu");
      router.push("/admin/premium/ocr/create/final");

    } catch (err) {
      showNotice("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-10 text-gray-900">

      {/* HEADER */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Şablon Oluşturma
        </h1>
        <p className="text-base text-gray-600">
          Belgenizi yükleyin. Yapay Zeka, belge içeriğini analiz ederek otomatik alan
          eşleştirmeleri ve şablon yapısı oluştursun.
        </p>
      </header>

      {/* DROP ZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`
          rounded-2xl border-2 border-dashed
          ${dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-gray-50"}
          px-8 py-12 text-center transition-colors
        `}
      >
        <label className="cursor-pointer block space-y-2">
          <p className="text-base font-medium text-gray-900">
            Belge yükleyin
          </p>
          <p className="text-sm text-gray-500">
            Dosyayı sürükleyip bırakın veya bilgisayarınızdan seçin
          </p>

          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      </div>

      {/* FILE PREVIEW */}
      {file && (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          {file.type.startsWith("image") && (
            <img
              src={URL.createObjectURL(file)}
              alt="Yüklenen belge önizleme"
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}

          <div className="flex-1">
            <p className="text-sm font-medium truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB · Yüklendi
            </p>
          </div>

          {/* REMOVE */}
          <button
            onClick={removeFile}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
            title="Dosyayı kaldır"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ACTION */}
      <div className="space-y-4">
        <button
          disabled={!file || loading}
          onClick={handleUpload}
          className="
            w-full py-4 rounded-xl font-medium text-base text-white
            bg-gradient-to-r from-indigo-500 to-violet-600
            hover:from-indigo-600 hover:to-violet-700
            transition-all
            disabled:opacity-40
          "
        >
          {loading ? "Yapay Zeka Analiz Ediyor…" : "Şablonu Oluştur"}
        </button>

        {loading && <AILoader />}
      </div>

      {/* NOTICE */}
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            fixed bottom-8 right-8
            rounded-xl bg-gray-900 text-white
            px-5 py-3 text-sm shadow-xl
          "
        >
          {notice}
        </motion.div>
      )}
    </div>
  );
}
