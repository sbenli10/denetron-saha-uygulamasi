//APP\app\components\layout\admin\notifications\NotificationPanel.tsx
"use client";

import { useNotifications } from "./NotificationProvider";
import NotificationItem from "./NotificationItem";
import { CheckCheck } from "lucide-react";
import { useAccentColor } from "./useAccentColor";

export default function NotificationPanel() {
  const { notifications, unread, markAllAsRead } = useNotifications();
  const accent = useAccentColor();

  return (
    <div
      role="dialog"
      aria-label="Bildirim paneli"
      style={{ ["--accent" as any]: accent }}
      className="
        fixed inset-x-0 bottom-0 z-[999]
        sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:inset-auto
        w-full sm:w-[420px]
        max-h-[85vh] sm:max-h-[460px]
        rounded-t-2xl sm:rounded-2xl
        bg-neutral-900/70
        backdrop-blur-2xl
        border border-white/10
        shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]
        overflow-hidden
        animate-in fade-in slide-in-from-bottom-4 sm:zoom-in
      "
    >
      {/* macOS window chrome */}
      <div className="flex items-center gap-2 px-4 pt-3">
        <span className="h-3 w-3 rounded-full bg-red-500/90" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/90" />
        <span className="h-3 w-3 rounded-full bg-green-500/90" />
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Bildirimler</div>
            <div className="text-xs text-white/60">
              {unread > 0 ? `${unread} okunmamış` : "Tümü okundu"}
            </div>
          </div>

          {unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="
                inline-flex items-center gap-1.5
                rounded-lg px-3 py-1.5
                text-xs font-medium
                text-[color:var(--accent)]
                bg-white/5 hover:bg-white/10
                transition
              "
            >
              <CheckCheck size={14} />
              Okundu Yap
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto px-3 py-3 sm:max-h-[380px]">
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      </div>
    </div>
  );
}
