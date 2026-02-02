"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ToggleLeft, Type, FileText, List, Minus } from "lucide-react";
import type { Field } from "./TemplateEditor.types";

interface AddFieldSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: Field["type"]) => void;
}

const OPTIONS: {
  type: Field["type"];
  icon: any;
  title: string;
  desc: string;
}[] = [
  {
    type: "boolean",
    icon: ToggleLeft,
    title: "Boolean Alan",
    desc: "Evet / Hayır seçenekli alan"
  },
  {
    type: "text",
    icon: Type,
    title: "Metin Alanı",
    desc: "Kısa açıklama metni"
  },
  {
    type: "textarea",
    icon: FileText,
    title: "Not / Açıklama",
    desc: "Uzun metin açıklamaları"
  },
  {
    type: "select",
    icon: List,
    title: "Seçim Alanı",
    desc: "Birden fazla seçenek sunar"
  },
  {
    type: "divider",
    icon: Minus,
    title: "Bölüm Ayırıcı",
    desc: "Alanları gruplandırır"
  }
];

export default function AddFieldSheet({ open, onClose, onSelect }: AddFieldSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ARKAPLAN BLUR */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* BOTTOM SHEET */}
          <motion.div
            className="
              fixed bottom-0 left-0 right-0 z-50
              bg-[#0d111c]/95 border-t border-white/10
              rounded-t-3xl p-6
              backdrop-blur-2xl
            "
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg font-semibold">Yeni Alan Ekle</h2>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* GRID MENU */}
            <div className="grid grid-cols-2 gap-4">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => {
                    onSelect(opt.type);
                    onClose();
                  }}
                  className="
                    flex flex-col items-start
                    p-4 rounded-2xl
                    bg-white/5 border border-white/10
                    hover:bg-white/10
                    transition
                  "
                >
                  <opt.icon className="w-6 h-6 text-white/80" />
                  <div className="mt-3 text-left">
                    <div className="text-white font-medium text-sm">{opt.title}</div>
                    <div className="text-white/50 text-xs">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
