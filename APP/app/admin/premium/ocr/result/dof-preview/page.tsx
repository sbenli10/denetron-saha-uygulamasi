"use client";
export const dynamic = "force-dynamic";

import { useOCRStore } from "@/app/admin/templates/ocr/ocrStore";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function DOFPreviewPage() {
  const { dofDrafts } = useOCRStore();

  if (!dofDrafts || dofDrafts.length === 0) {
    return (
      <div className="p-10 text-center text-gray-400">
        Herhangi bir uygunsuzluk tespit edilmedi.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10 text-white bg-[#06070B]">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-10 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent"
      >
        AI Tarafından Tespit Edilen Uygunsuzluklar
      </motion.h1>

      <div className="space-y-6 max-w-4xl mx-auto">
        {dofDrafts.map((dof, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <AlertTriangle className="text-amber-400 mt-1" size={28} />

              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-semibold">{dof.title}</h2>

                <p className="text-gray-300 text-sm">
                  {dof.description}
                </p>

                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300">
                    Risk: {dof.riskLevel}
                  </span>

                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">
                    {dof.law}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-green-300 mt-2">
                  <ShieldAlert size={16} />
                  {dof.recommendedAction}
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="flex justify-end pt-8">
          <Link
            href="/admin/dof/create-from-ai"
            className="px-8 py-4 rounded-2xl text-lg font-semibold
                       bg-gradient-to-r from-purple-600 to-blue-500
                       hover:opacity-90 transition"
          >
            DÖF Kayıtlarını Oluştur
          </Link>
        </div>
      </div>
    </div>
  );
}
