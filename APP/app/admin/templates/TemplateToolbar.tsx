"use client";

import { useRouter } from "next/navigation";
import { Plus, ScanText } from "lucide-react";

export default function TemplateToolbar() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div></div>

      <div className="flex items-center gap-2">

        {/* YENİ ŞABLON */}
        <button
          onClick={() => router.push("/admin/templates/new")}
          className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" />
          Yeni Şablon
        </button>

        {/* OCR İLE OLUŞTUR */}
        <button
        
          onClick={() => router.push("/admin/premium/ocr/create")}
          className="flex h-10 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700"
        >
          <ScanText className="h-4 w-4 text-neutral-700" />
          Otomatik Şablon Oluştur
        </button>
      </div>
    </div>
  );
}
