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

export default function InspectionPhotoUploadPage() {
  const router = useRouter();

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function showNotice(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 2500);
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

  async function handleUpload() {
    if (files.length === 0) {
      showNotice("Yüklenecek fotoğraf bulunamadı");
      return;
    }

    // ekstra güvenlik
    if (files.some((f) => !f.file.type.startsWith("image/"))) {
      showNotice("Sadece fotoğraf analiz edilebilir");
      return;
    }

    setLoading(true);
    showNotice("Analiz başlatıldı");

    // 🔥 PREVIEW'LERİ KAYDET
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
      if (!res.ok) throw new Error();

      const data = await res.json();
      sessionStorage.setItem("isg_result", JSON.stringify(data));
      router.push("/admin/isg/result");
    } catch {
      showNotice("Analiz sırasında hata oluştu");
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
        <div className="fixed bottom-8 right-8 rounded-xl bg-gray-900 text-white px-5 py-3 text-sm shadow-xl">
          {notice}
        </div>
      )}
    </div>
  );
}
