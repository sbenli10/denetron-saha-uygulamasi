"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Sun,
  Moon,
  PanelLeft,
} from "lucide-react";
import { useSettings } from "./useSettings";
import { useEffect } from "react";

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { settings, setSettings } = useSettings();

  const update = (partial: Partial<typeof settings>) => {
  setSettings({ ...settings, ...partial });
};


  /* =============================
     BODY LOCK + EFFECT FLAG
  ============================= */
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    document.body.dataset.modal = "open";

    return () => {
      document.body.style.overflow = "";
      delete document.body.dataset.modal;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          {/* BACKDROP */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* MODAL */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="
              relative z-10
              w-full max-w-[520px]
              rounded-2xl
              bg-sidebar text-sidebar-foreground
              border border-border
              shadow-panel
              p-5 sm:p-6
              max-h-[90vh] overflow-y-auto
            "
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles size={18} />
                Ayarlar
              </h2>

              <button
                onClick={onClose}
                aria-label="Kapat"
                className="rounded-lg p-1.5 hover:bg-accent"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-8">
              {/* ================= THEME ================= */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sun size={16} />
                  Tema
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "light", icon: <Sun size={16} /> },
                    { key: "dark", icon: <Moon size={16} /> },
                  ].map(({ key, icon }) => (
                    <button
                      key={key}
                      onClick={() => update({ theme: key as any })}
                      className={`
                        flex items-center justify-center gap-2
                        rounded-xl border px-4 py-3 text-sm font-medium
                        transition
                        ${
                          settings.theme === key
                            ? "bg-primary text-primary-foreground ring-2 ring-primary"
                            : "bg-accent text-accent-foreground hover:bg-accent/70"
                        }
                      `}
                    >
                      {icon}
                      {key.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>

              {/* ================= ACCENT ================= */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium">Accent Rengi</h3>

                <div className="flex gap-3 flex-wrap">
                  {["amber", "emerald", "sky", "violet"].map((a) => (
                    <button
                      key={a}
                      data-accent={a}
                      aria-label={`${a} accent`}
                      onClick={() => update({ accent: a as any })}
                      className={`
                        relative h-10 w-10 rounded-full
                        border border-border
                        transition-transform hover:scale-105
                        ${
                          settings.accent === a
                            ? "ring-4 ring-primary ring-offset-2 ring-offset-background"
                            : ""
                        }
                      `}
                    />
                  ))}
                </div>
              </section>

              {/* ================= EFFECTS ================= */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles size={16} />
                  Görsel Efektler
                </h3>

                <div className="space-y-2">
                  {["glow", "grid", "scanline"].map((ef) => (
                    <label
                      key={ef}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="uppercase">{ef}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={
                          settings.effects[
                            ef as keyof typeof settings.effects
                          ]
                        }
                        onChange={(e) =>
                          update({
                            effects: {
                              ...settings.effects,
                              [ef]: e.target.checked,
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </section>

              {/* ================= SIDEBAR ================= */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <PanelLeft size={16} />
                  Sidebar Davranışı
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {["hover", "click", "always"].map((m) => (
                    <button
                      key={m}
                      onClick={() => update({ sidebarMode: m as any })}
                      className={`
                        rounded-lg border px-3 py-2 text-xs font-medium
                        transition
                        ${
                          settings.sidebarMode === m
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground hover:bg-accent/70"
                        }
                      `}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
