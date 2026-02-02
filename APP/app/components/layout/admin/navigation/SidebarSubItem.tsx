//APP\app\components\layout\admin\navigation\SidebarSubItem.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { applyRipple } from "@/app/components/ui/ripple";

export default function SidebarSubItem({
  href,
  label,
  expanded,
}: {
  href: string;
  label: string;
  expanded: boolean;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  if (!expanded) return null;

  return (
    <Link
      href={href}
      onMouseDown={(e) => applyRipple(e, e.currentTarget)}
      aria-current={active ? "page" : undefined}
      className={[
        "relative block px-3 py-2 rounded-lg text-sm overflow-hidden transition-all",

        active
          ? "bg-indigo-100 text-indigo-700 font-medium border border-indigo-200 shadow-sm"
          : "text-muted-foreground hover:bg-indigo-50 hover:text-indigo-700",
      ].join(" ")}
    >
      {active && (
        <span className="
          absolute left-0 top-1/2 -translate-y-1/2
          h-4 w-1 bg-indigo-600 rounded-r-md
        " />
      )}

      {label}
    </Link>
  );
}
