// APP/app/admin/templates/[id]/edit/VersionSidebar.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import type { TemplateVersion } from "./TemplateEditor.types";
import PremiumRequired from "@/app/admin/_components/PremiumRequired";

interface Props {
  open: boolean;
  onClose: () => void;
  versions: TemplateVersion[];
  templateId: string;
  activeVersion: string | null;
  onRestore: (version: string) => void;
  onDelete: (version: string) => void;
  isPremium: boolean;
  role: string | null;
}

export default function VersionSidebar({
  open,
  onClose,
  versions,
  activeVersion,
  onRestore,
  onDelete,
  isPremium,
  role,
}: Props) {
  const [confirmVersion, setConfirmVersion] = useState<string | null>(null);
  const latestVersion = versions[0]?.version;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* OVERLAY — HER ZAMAN KAPATIR */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* SIDEBAR CONTAINER */}
          <motion.div
            className="
              fixed top-0 bottom-0 right-0
              w-[92%] max-w-[400px]
              bg-[#f5f5f7]
              border-l border-black/10
              z-50
              shadow-2xl
              flex flex-col
            "
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
              <h2 className="text-base font-semibold text-[#1d1d1f]">
                Şablon Versiyonları
              </h2>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5"
              >
                <X className="w-5 h-5 text-black/70" />
              </button>
            </div>

            {/* ================= FREE USER ================= */}
            {!isPremium && (
              <div className="flex-1 overflow-auto">
                <PremiumRequired role={role} />
              </div>
            )}

            {/* ================= PREMIUM USER ================= */}
            {isPremium && (
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {versions.length === 0 && (
                  <div className="text-sm text-black/50">
                    Henüz kaydedilmiş bir versiyon yok.
                  </div>
                )}

                {versions.map((v) => {
                  const isActive = v.version === activeVersion;
                  const isLatest = v.version === latestVersion;
                  const cannotDelete = isActive || isLatest;

                  return (
                    <div
                      key={v.id}
                      className="
                        rounded-2xl bg-white
                        border border-black/10
                        shadow-sm
                        p-4
                        flex items-center justify-between
                      "
                    >
                      {/* INFO */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            v{v.version}
                          </span>

                          {isActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Aktif
                            </span>
                          )}

                          {isLatest && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Son
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-black/50">
                          {new Date(v.created_at).toLocaleString("tr-TR")}
                        </div>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRestore(v.version)}
                          className="
                            px-3 py-1.5
                            text-xs font-medium
                            rounded-full
                            bg-blue-600 text-white
                            hover:bg-blue-700
                          "
                        >
                          Yükle
                        </button>

                        <button
                          disabled={cannotDelete}
                          onClick={() => setConfirmVersion(v.version)}
                          className={`
                            p-2 rounded-full transition
                            ${
                              cannotDelete
                                ? "text-black/20 cursor-not-allowed"
                                : "text-red-600 hover:bg-red-50"
                            }
                          `}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
