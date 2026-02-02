"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function ImportButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("IMPORT :: dosya seçilmedi");
      return;
    }

    console.log("IMPORT :: file seçildi:", file.name);

    const fd = new FormData();
    fd.append("file", file);

    console.log("IMPORT :: OCR API çağrılıyor...");

    const res = await fetch("/api/admin/templates/ocr-extract", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      console.error("IMPORT :: API ERROR");
      return;
    }

    const json = await res.json();
    console.log("IMPORT :: API RESULT:", json);

    if (!json.template) {
      console.error("IMPORT :: API JSON içinde 'template' yok");
      return;
    }

    localStorage.setItem("auto_template", JSON.stringify(json.template));

    console.log("IMPORT :: localStorage yazıldı >> new sayfasına gidiliyor...");

    router.push("/admin/templates/new");
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"      // ←← DÜZELTİLEN EN KRİTİK KISIM
        className="hidden"
        onChange={handleFile}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-100
                   dark:border-neutral-700 dark:hover:bg-neutral-900"
      >
        İçe Aktar
      </button>
    </>
  );
}
