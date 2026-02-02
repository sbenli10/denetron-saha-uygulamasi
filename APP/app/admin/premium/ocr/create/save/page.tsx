"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Save,
  Eye,
} from "lucide-react";
// @ts-expect-error
import confetti from "canvas-confetti";
import { useOCRStore } from "@/app/admin/templates/ocr/ocrStore";

export default function PremiumOCRSavePage() {
  const router = useRouter();
  const { template } = useOCRStore();

  const [status, setStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  async function handleSave() {
    if (!template?.name || !template?.fields) {
      setStatus("error");
      return;
    }

    setStatus("saving");

    try {
      const res = await fetch("/api/admin/templates/create-from-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });

      if (!res.ok) throw new Error();

      setStatus("success");

      confetti({
        particleCount: 120,
        spread: 60,
        origin: { y: 0.7 },
      });

      setTimeout(() => {
        router.push("/admin/premium/ocr/dashboard");
      }, 1800);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10 text-gray-900">

      {/* HEADER */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Şablonu Kaydet
        </h1>
        <p className="text-base text-gray-600">
          Oluşturulan OCR şablonunu kaydetmeden önce alanları ön izleyin.
        </p>
      </header>

      {/* SUMMARY */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-2">
        <p className="text-sm text-gray-700">
          <strong>Şablon Adı:</strong> {template?.name ?? "—"}
        </p>
        <p className="text-sm text-gray-700">
          <strong>Alan Sayısı:</strong> {template?.fields?.length ?? 0}
        </p>
      </section>

      {/* TEMPLATE PREVIEW */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-900">
          <Eye size={18} />
          <h2 className="text-lg font-semibold">
            Şablon Ön İzleme
          </h2>
        </div>

        <div className="max-h-[360px] overflow-y-auto space-y-4 pr-2">
          {template?.fields?.map((field: any, idx: number) => (
            <div
              key={idx}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2"
            >
              <p className="text-sm font-medium text-gray-900">
                {field.label}
              </p>

              {/* FIELD TYPE PREVIEW */}
              {field.type === "boolean" && (
                <div className="flex gap-4 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" disabled /> Evet
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" disabled /> Hayır
                  </label>
                </div>
              )}

              {field.type === "text" && (
                <input
                  disabled
                  placeholder="Metin alanı"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                />
              )}

              {field.type === "number" && (
                <input
                  disabled
                  placeholder="0"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                />
              )}

              {field.type === "textarea" && (
                <textarea
                  disabled
                  placeholder="Uzun metin alanı"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                  rows={3}
                />
              )}

              {field.critical && (
                <p className="text-xs text-red-600 font-medium">
                  Kritik alan
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ACTION AREA */}
      <section className="space-y-4">

        {status === "idle" && (
          <button
            onClick={handleSave}
            className="
              inline-flex items-center justify-center gap-2
              w-full py-4 rounded-xl
              bg-indigo-600 text-white
              hover:bg-indigo-700
              transition
            "
          >
            <Save size={18} />
            Şablonu Kaydet
          </button>
        )}

        {status === "saving" && (
          <div className="flex items-center justify-center gap-3 text-indigo-600 py-6">
            <Loader2 className="animate-spin" />
            <span className="text-sm font-medium">
              Kaydediliyor…
            </span>
          </div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              flex flex-col items-center gap-3
              rounded-xl border border-green-200
              bg-green-50 p-6
            "
          >
            <CheckCircle2 className="text-green-600" size={40} />
            <p className="font-medium text-green-800">
              Şablon başarıyla kaydedildi
            </p>
            <p className="text-sm text-green-700">
              Kontrol paneline yönlendiriliyorsunuz…
            </p>
          </motion.div>
        )}

        {status === "error" && (
          <div className="
            flex items-center gap-3
            rounded-xl border border-red-200
            bg-red-50 p-5
            text-red-700
          ">
            <AlertTriangle size={20} />
            <p className="text-sm">
              Şablon kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.
            </p>
          </div>
        )}

      </section>
    </div>
  );
}
