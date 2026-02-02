//APP\app\components\layout\admin\settings\SettingsModal.tsx
"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useSettings } from "./useSettings";

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { settings, setSettings } = useSettings();

  if (!open) return null;

  const update = (partial: Partial<typeof settings>) =>
    setSettings({ ...settings, ...partial });

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="w-full max-w-xl bg-sidebar text-sidebar-foreground rounded-2xl border border-border shadow-panel p-6"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Ayarlar</h2>
          <button onClick={onClose}>
            <X className="text-foreground" />
          </button>
        </div>

        <div className="space-y-8">
          {/* THEME */}
          <section>
            <h3 className="text-sm font-medium mb-2">Tema</h3>
            <div className="flex gap-3">
              {["light", "dark"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => update({ theme: mode as any })}
                  className={`px-3 py-2 rounded-lg border ${
                    settings.theme === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          {/* ACCENT */}
          <section>
            <h3 className="text-sm font-medium mb-2">Accent Rengi</h3>
            <div className="flex gap-3">
              {["amber", "emerald", "sky", "violet"].map((a) => (
                <button
                  key={a}
                  onClick={() => update({ accent: a as any })}
                  className={`
                    w-10 h-10 rounded-full border border-border
                    ${settings.accent === a ? "ring-4 ring-primary" : ""}
                  `}
                  style={{ backgroundColor: `var(--accent-color)` }}
                  data-accent={a}
                />
              ))}
            </div>
          </section>

          {/* EFFECTS */}
          <section>
            <h3 className="text-sm font-medium mb-2">Efektler</h3>
            <div className="space-y-2">
              {["glow", "grid", "scanline"].map((ef) => (
                <label key={ef} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={settings.effects[ef as keyof typeof settings.effects]}
                    onChange={(e) =>
                      update({
                        effects: {
                          ...settings.effects,
                          [ef]: e.target.checked,
                        },
                      })
                    }
                  />
                  {ef.toUpperCase()}
                </label>
              ))}
            </div>
          </section>

          {/* SIDEBAR BEHAVIOR */}
          <section>
            <h3 className="text-sm font-medium mb-2">Sidebar Davranışı</h3>
            <div className="flex gap-3">
              {["hover", "click", "always"].map((m) => (
                <button
                  key={m}
                  onClick={() => update({ sidebarMode: m as any })}
                  className={`px-3 py-2 rounded-lg border ${
                    settings.sidebarMode === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
