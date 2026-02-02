//APP\app\components\layout\admin\navigation\SidebarSection.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { applyRipple } from "@/app/components/ui/ripple";
import type { SidebarNavItem } from "./nav-config";

export default function SidebarSection({
  item,
  expanded,
  closeMobile,
}: {
  item: SidebarNavItem;
  expanded: boolean;
  closeMobile?: () => void;
}) {

  const pathname = usePathname();
  const hasActiveChild =
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false;

  const [open, setOpen] = useState(hasActiveChild);
  const Icon = item.icon;

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  const firstChildHref = useMemo(
    () => item.children?.[0]?.href,
    [item.children]
  );

  // Collapsed behavior
  if (!expanded && firstChildHref) {
    const active = hasActiveChild;

    return (
      <Link
        href={firstChildHref}
        onMouseDown={(e) => applyRipple(e, e.currentTarget)}
        className={[
          "group flex items-center justify-center rounded-xl px-3 py-2.5 transition cursor-pointer",

          active
            ? "bg-indigo-600 text-white shadow-md"
            : "text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 items-center justify-center rounded-lg border",
            active
              ? "bg-indigo-500/40 text-white border-indigo-200"
              : "bg-white/60 border-border",
          ].join(" ")}
        >
          <Icon size={18} />
        </span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onMouseDown={(e) => applyRipple(e as any, e.currentTarget)}
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition overflow-hidden",

          hasActiveChild
            ? "bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200"
            : "text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700",
        ].join(" ")}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white/60 shadow-sm">
            <Icon size={18} />
          </span>

          <span className="truncate font-medium">{item.label}</span>
        </div>

        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      <div
        className={[
          "ml-[52px] transition-all duration-200 ease-out overflow-hidden",
          open ? "max-h-48 opacity-100 mt-1" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        {item.children?.map((child) => {
          const active = pathname.startsWith(child.href);

          return (
            <Link
              key={child.href}
              href={child.href}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  closeMobile?.();
                }
              }}
              onMouseDown={(e) => applyRipple(e, e.currentTarget)}
              className={[
                "block rounded-lg px-3 py-2 text-sm transition overflow-hidden",

                active
                  ? "bg-indigo-100 text-indigo-700 font-medium border border-indigo-200"
                  : "text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700",
              ].join(" ")}
            >
              {child.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
