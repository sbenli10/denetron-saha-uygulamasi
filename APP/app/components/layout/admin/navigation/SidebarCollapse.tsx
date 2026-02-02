//APP\app\components\layout\admin\navigation\SidebarCollapse.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { applyRipple } from "@/app/components/ui/ripple";

export default function SidebarCollapse({ expanded }: { expanded: boolean }) {
  return (
    <button
      onMouseDown={(e) => applyRipple(e, e.currentTarget)}
      className="
        w-full flex items-center justify-between
        rounded-xl px-3 py-2
        bg-white/60 backdrop-blur border border-border
        hover:bg-indigo-50 transition cursor-pointer select-none
      "
    >
      <span className="text-xs text-muted-foreground">
        {expanded ? "Geniş görünüm" : "Dar görünüm"}
      </span>

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 border border-border">
        {expanded ? (
          <ChevronLeft size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
