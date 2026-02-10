"use client";

import Link from "next/link";
import { CheckCircle2, FileText, Layers } from "lucide-react";
import { useOCRStore } from "@/app/admin/templates/ocr/ocrStore";

export default function PremiumOCRFinalPage() {
  const { ocr_clean, template } = useOCRStore();

  const fieldCount = template?.fields?.length ?? 0;
  const sectionCount = ocr_clean?.sections?.length ?? 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-10 text-gray-900">

      {/* HEADER */}
      <header className="space-y-3">
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle2 size={28} />
          <h1 className="text-3xl font-semibold tracking-tight">
            Şablon Oluşturuldu
          </h1>
        </div>

      <p className="text-base text-gray-600 leading-relaxed">
        Yüklenen belge analiz edilmiş ve kullanıma hazır bir denetim şablonu haline getirilmiştir.
      </p>
      </header>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Layers className="text-indigo-600" />
            <h2 className="font-medium text-gray-900">
              Tespit Edilen Bölümler
            </h2>
          </div>

          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {sectionCount}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Belgeden otomatik olarak tespit edilen bölüm sayısı
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="text-violet-600" />
            <h2 className="font-medium text-gray-900">
              Oluşturulan Alanlar
            </h2>
          </div>

          <p className="mt-3 text-3xl font-semibold text-gray-900">
            {fieldCount}
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Form şablonunda kullanılacak toplam alan sayısı
          </p>
        </div>

      </section>

      {/* DETAIL */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Sonraki Adımlar
        </h3>

        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>
            Şablonu kaydedip düzenleyebilirsiniz.
          </li>
          <li>
            Alan tiplerini veya kritik işaretlerini manuel olarak güncelleyebilirsiniz.
          </li>
          <li>
            Şablonu Saha Denetim işlemlerinde aktif olarak kullanabilirsiniz.
          </li>
        </ul>
      </section>

      {/* ACTIONS */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between pt-4">

        <Link
          href="/admin/premium/ocr/dashboard"
          className="
            inline-flex justify-center items-center
            px-6 py-3 rounded-xl
            border border-gray-300
            text-gray-700 bg-white
            hover:bg-gray-50
            transition
          "
        >
          Panele Dön
        </Link>

        <Link
          href="/admin/premium/ocr/create/save"
          className="
            inline-flex justify-center items-center
            px-6 py-3 rounded-xl
            bg-indigo-600 text-white
            hover:bg-indigo-700
            transition
          "
        >
          Kaydetmeye Geç
        </Link>
      </div>
    </div>
  );
}
