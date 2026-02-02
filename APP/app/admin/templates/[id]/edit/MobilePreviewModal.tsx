//APP\app\admin\templates\[id]\edit\MobilePreviewModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import PreviewPanel from "./PreviewPanel";
import type { Field } from "./TemplateEditor.types";

export default function MobilePreviewModal({
  open,
  onClose,
  fields,
  name
}: {
  open: boolean;
  onClose: () => void;
  fields: Field[];
  name: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="
              fixed bottom-0 left-0 right-0 
              rounded-t-3xl bg-[#0d111c]/95 backdrop-blur-2xl
              border-t border-white/10 
              p-5 z-50 md:hidden
              max-h-[80vh] overflow-y-auto
            "
            initial={{ y: 500 }}
            animate={{ y: 0 }}
            exit={{ y: 500 }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white/90 font-semibold text-lg">Önizleme</h2>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <PreviewPanel name={name} fields={fields} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
