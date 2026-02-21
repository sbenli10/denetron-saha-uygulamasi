//APP\app\components\layout\admin\notifications\NotificationPanel.tsx
"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, X } from "lucide-react";

import { useNotifications } from "./NotificationProvider";
import NotificationItem from "./NotificationItem";
import { useAccentColor } from "./useAccentColor";

export default function NotificationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { notifications, unread, markAllAsRead } = useNotifications();
  const accent = useAccentColor();

  const [mounted, setMounted] = useState(false);
  const startY = useRef<number | null>(null);

  /* ===================== MOUNT ===================== */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ===================== ESC + BACK ===================== */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onPopState = () => onClose();

    window.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPopState);

    history.pushState({ modal: true }, "");

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
    };
  }, [open, onClose]);

  /* ===================== SWIPE DOWN ===================== */
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 120) {
      startY.current = null;
      onClose();
    }
  };

  /* ===================== RENDER GUARD ===================== */
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* BACKDROP */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
          />

          {/* PANEL */}
          <motion.div
            role="dialog"
            aria-label="Bildirim paneli"
            style={{
              ["--accent" as any]: accent,
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            className="
              fixed inset-x-0 bottom-0 z-[9999]
              sm:inset-auto sm:right-4 sm:top-16
              w-full sm:w-[420px]
              max-h-[90vh] sm:max-h-[460px]
              rounded-t-3xl sm:rounded-2xl
              bg-neutral-900/90
              backdrop-blur-2xl
              border border-white/10
              shadow-[0_30px_80px_-25px_rgba(0,0,0,0.9)]
              overflow-hidden
            "
          >
            {/* Drag Handle */}
            <div className="sm:hidden flex justify-center py-2">
              <div className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>

            {/* HEADER */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  Bildirimler
                </div>
                <div className="text-xs text-white/60">
                  {unread > 0 ? `${unread} okunmamış` : "Tümü okundu"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="
                      text-xs px-3 py-1.5 rounded-lg
                      text-[color:var(--accent)]
                      bg-white/5 hover:bg-white/10
                      transition
                    "
                  >
                    <CheckCheck size={14} />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X size={16} className="text-white/70" />
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="overflow-y-auto px-3 py-3 max-h-[calc(90vh-110px)]">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-sm text-white/50">
                  Bildirim bulunmuyor
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
