"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "./NotificationProvider";
import NotificationPanel from "./NotificationPanel";
import { useAccentColor } from "./useAccentColor";

export default function NotificationBell() {
  const { unread } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const accent = useAccentColor();

  /* Click outside to close */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="
            group relative inline-flex h-9 w-9
            items-center justify-center
            rounded-full
            bg-black/5 dark:bg-white/5
            hover:bg-black/10 dark:hover:bg-white/10
            transition
            focus:outline-none
            focus-visible:ring-2 focus-visible:ring-primary/30
        "
        aria-label="Bildirimler"
        >
        <Bell
            size={18}
            className="
            text-muted-foreground
            group-hover:text-foreground
            transition
            "
        />

        {unread > 0 && (
            <span
            className="
                absolute -top-0.5 -right-0.5
                flex h-4 min-w-[16px]
                items-center justify-center
                rounded-full px-1
                text-[10px] font-semibold
                text-white
                bg-primary
            "
            >
            {unread > 9 ? "9+" : unread}
            </span>
        )}
        </button>


      {/* Panel */}
      {open && (
        <div
          style={{ ["--accent" as any]: accent }}
          className="absolute right-0 top-full"
        >
          <NotificationPanel />
        </div>
      )}
    </div>
  );
}
