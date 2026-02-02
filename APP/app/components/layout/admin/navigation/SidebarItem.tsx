//APP\app\components\layout\admin\navigation\SidebarItem.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { applyRipple } from "@/app/components/ui/ripple";
import type { SidebarNavItem } from "./nav-config";

export default function SidebarItem({
  item,
  expanded,
  closeMobile,
}: {
  item: SidebarNavItem;
  expanded: boolean;
  closeMobile?: () => void;
}) {
  const pathname = usePathname();
  const active = item.href ? pathname.startsWith(item.href) : false;
  const Icon = item.icon;

  function handleClick() {
    // 📱 MOBİLDE sidebar otomatik kapansın
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      closeMobile?.();
    }
  }

  return (
    <Link
      href={item.href!}
      onClick={handleClick}
      onMouseDown={(e) => applyRipple(e, e.currentTarget)}
      className={[
        "group relative flex items-center select-none cursor-pointer rounded-xl overflow-hidden",
        "h-11 px-3 transition-all",

        active
          ? "bg-indigo-100/70 text-indigo-700 shadow-sm border border-indigo-200"
          : "text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700",
      ].join(" ")}
    >
      {active && (
        <span
          className="
            absolute left-0 top-1/2 -translate-y-1/2
            h-6 w-1.5 bg-indigo-600 rounded-r-full
            shadow-[0_0_6px_rgba(99,102,241,0.6)]
          "
        />
      )}

      {/* ICON */}
      <span
        className={[
          "flex h-9 w-9 items-center justify-center rounded-lg border transition backdrop-blur",
          active
            ? "border-indigo-300 text-indigo-600 bg-white/70"
            : "border-border bg-white/50 group-hover:text-indigo-700",
        ].join(" ")}
      >
        <Icon size={18} />
      </span>

      {expanded && (
        <span className="ml-3 truncate text-[13px] font-medium">
          {item.label}
        </span>
      )}
    </Link>
  );
}
