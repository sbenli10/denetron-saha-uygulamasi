"use client";

import { useRef } from "react";
import { useNotifications, type NotificationItem } from "./NotificationProvider";
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

/* ================= RELATIVE TIME ================= */

function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);

  if (min < 1) return "şimdi";
  if (min < 60) return `${min} dk`;

  const h = Math.floor(min / 60);
  if (h < 24) return `${h} sa`;

  return `${Math.floor(h / 24)} gün`;
}

/* ================= ICON MAPPING ================= */

function getIcon(title: string) {
  const t = title.toLowerCase();

  if (t.includes("başar") || t.includes("onay")) return CheckCircle;
  if (t.includes("uyarı") || t.includes("hata")) return AlertTriangle;
  if (t.includes("bilgi")) return Info;

  return Bell;
}

/* ================= COMPONENT ================= */

export default function NotificationItem({
  notification,
}: {
  notification: NotificationItem;
}) {
  const { markAsRead } = useNotifications();
  const Icon = getIcon(notification.title);

  /* Swipe detection */
  const startX = useRef<number | null>(null);

  function handleRead() {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (startX.current === null) return;

    const delta = e.clientX - startX.current;

    // 👉 Swipe left / right → mark as read
    if (Math.abs(delta) > 60) {
      handleRead();
    }

    startX.current = null;
  }

  return (
    <button
      type="button"
      onClick={handleRead}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className="
        group w-full text-left
        flex items-start gap-3
        rounded-xl px-3 py-2.5
        border border-white/10
        bg-white/5
        hover:bg-white/10
        transition
        focus:outline-none
        focus-visible:ring-2 focus-visible:ring-white/20
      "
    >
      {/* Icon */}
      <div
        className="
          mt-0.5 flex h-8 w-8 items-center justify-center
          rounded-lg
          bg-[color:var(--accent)]/15
          text-[color:var(--accent)]
          shrink-0
        "
      >
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {notification.title}
        </div>

        {notification.message && (
          <div className="mt-0.5 text-xs text-white/60 line-clamp-2">
            {notification.message}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {!notification.read && (
          <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
        )}

        <span className="text-[10px] text-white/40 whitespace-nowrap">
          {formatRelativeTime(notification.created_at)}
        </span>
      </div>
    </button>
  );
}
