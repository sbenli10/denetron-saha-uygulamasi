// APP/app/admin/isg/photo/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, DragEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, X, Image as ImageIcon } from "lucide-react";

type PreviewFile = {
  file: File;
  preview: string;
};
type NoticeType = "success" | "error" | "warning" | "info";

type Notice = {
  message: string;
  type: NoticeType;
};



export default function InspectionPhotoUploadPage() {
  const router = useRouter();

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);


  function showNotice(message: string, type: NoticeType = "info") {
  setNotice({ message, type });
  setTimeout(() => setNotice(null), 3000);
}


  /* ---------------- ADD FILES (IMAGE ONLY) ---------------- */

  function addFiles(selected: FileList | File[]) {
    const arr = Array.from(selected);

    const images = arr.filter((file) =>
      file.type.startsWith("image/")
    );

    if (images.length === 0) {
      showNotice("Sadece fotoğraf yükleyebilirsiniz");
      return;
    }

    const mapped: PreviewFile[] = images.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...mapped]);
    showNotice("Fotoğraflar eklendi");
  }

  /* ---------------- REMOVE FILE ---------------- */

  function removeFile(index: number) {
    setFiles((prev) => {
      const target = prev[index];
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  /* ---------------- UPLOAD (IMAGE ONLY) ---------------- */
/* ---------------- UPLOAD (IMAGE ONLY) ---------------- */
async function handleUpload() {
  if (files.length === 0) {
    showNotice("Yüklenecek fotoğraf bulunamadı", "warning");
    return;
  }

  if (files.some((f) => !f.file.type.startsWith("image/"))) {
    showNotice("Sadece fotoğraf analiz edilebilir", "error");
    return;
  }

  if (loading) return;

  setLoading(true);
  showNotice("Analiz başlatıldı...", "info");

  const previews = files.map((f) => ({
    name: f.file.name,
    preview: f.preview,
  }));

  sessionStorage.setItem(
    "isg_photo_previews",
    JSON.stringify(previews)
  );

  const formData = new FormData();
  files.forEach((f) => formData.append("files", f.file));

  try {
    const res = await fetch("/api/admin/isg/analyze/photo", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => null);

    /* ---------------- HTTP ERROR ---------------- */
    if (!res.ok) {
      let message =
        typeof data?.error === "string"
          ? data.error
          : data?.error?.message ||
            data?.message ||
            "Analiz sırasında hata oluştu";

      if (res.status === 429) {
        message = "Yapay zekâ kullanım limiti doldu. Daha sonra tekrar deneyin.";
      }

      if (res.status === 403) {
        message = "Bu özellik premium üyelik gerektirir.";
      }

      if (res.status >= 500) {
        message = "Sunucu hatası oluştu. Lütfen tekrar deneyin.";
      }

      showNotice(message, "error");
      return;
    }

    /* ---------------- BUSINESS ERROR ---------------- */
    if (!data?.success) {
      showNotice(
        data?.error?.message || "Analiz başarısız",
        "error"
      );
      return;
    }

    /* ---------------- SUCCESS ---------------- */
    sessionStorage.setItem(
      "isg_result",
      JSON.stringify(data)
    );

    showNotice("Analiz tamamlandı", "success");

    setTimeout(() => {
      router.push("/admin/isg/result");
    }, 600);

  } catch (err) {
    console.error("ISG upload/analyze failed:", err);
    showNotice(
      "Analiz sırasında beklenmeyen bir hata oluştu",
      "error"
    );
  } finally {
    setLoading(false);
  }
}


  /* ---------------- CLEANUP (UNMOUNT ONLY) ---------------- */

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-2xl mx-auto py-20 space-y-10 text-gray-900">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">
          Sahadan Fotoğraf Yükleme
        </h1>
        <p className="text-gray-600">
          Yalnızca fotoğraf yükleyebilirsiniz. Video veya başka dosyalar
          analiz edilmez.
        </p>
      </header>

      {/* DROP ZONE */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.length) {
            addFiles(e.dataTransfer.files);
          }
        }}
        className={`rounded-2xl border-2 border-dashed px-8 py-14 text-center transition ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50"
        }`}
      >
        <UploadCloud className="mx-auto mb-4 text-gray-400" size={40} />
        <label className="cursor-pointer block space-y-2">
          <p className="font-medium">Fotoğraf yükleyin</p>
          <p className="text-sm text-gray-500">
            JPG / PNG formatları desteklenir
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
            }}
          />
        </label>
      </div>

      {/* PREVIEWS */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {files.map((f, i) => (
            <div
              key={i}
              className="relative rounded-xl border bg-white p-3 shadow-sm"
            >
              <button
                onClick={() => removeFile(i)}
                className="absolute top-2 right-2 rounded-md bg-white p-1 shadow hover:bg-gray-100"
              >
                <X size={14} />
              </button>

              <img
                src={f.preview}
                alt={f.file.name}
                className="h-32 w-full rounded-md object-cover"
              />

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                <ImageIcon size={14} />
                <span className="truncate">{f.file.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBMIT */}
      <button
        disabled={files.length === 0 || loading}
        onClick={handleUpload}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium disabled:opacity-40"
      >
        {loading ? "Analiz Ediliyor…" : "Analizi Başlat"}
      </button>

      {notice && (
        <div
          className={`fixed bottom-8 right-8 rounded-xl px-5 py-3 text-sm shadow-xl text-white
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
