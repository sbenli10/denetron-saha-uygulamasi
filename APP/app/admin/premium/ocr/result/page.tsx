//APP\app\admin\premium\ocr\result\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useOCRStore } from "@/app/admin/templates/ocr/ocrStore";
import VisionCard from "../components/VisionCard";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function OCRResultPage() {
  const router = useRouter();
  const { template } = useOCRStore();

  const saveTemplate = async () => {
    const res = await fetch("/api/admin/templates/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template }),
    });

    if (res.ok) {
      router.push("/admin/templates");
    }
  };

  return (
    <div className="relative min-h-screen w-full p-10 text-white">

      <div className="absolute inset-0 bg-gradient-to-br from-purple-800/30 to-black/90 blur-[100px] -z-10" />

      <motion.h1
        initial={{ opacity: 0, y: -20, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent"
      >
        Şablon Oluşturuldu
      </motion.h1>

      <div className="max-w-4xl mx-auto">
        <VisionCard title="Oluşturulan Şablon">
          <pre className="max-h-[500px] overflow-auto text-gray-200 text-sm">
            {JSON.stringify(template, null, 2)}
          </pre>

          <button
            onClick={saveTemplate}
            className="mt-6 w-full px-6 py-4 rounded-2xl text-xl font-semibold 
                       bg-gradient-to-r from-blue-500 to-purple-500 
                       hover:from-blue-600 hover:to-purple-600 
                       shadow-lg shadow-blue-500/30"
          >
            Şablonu Kaydet
          </button>
        </VisionCard>
      </div>
    </div>
  );
}
