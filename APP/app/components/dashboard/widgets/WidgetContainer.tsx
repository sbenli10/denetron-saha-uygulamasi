"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function WidgetContainer({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "w-full rounded-2xl border border-white/10",
        "bg-card/75 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.18)]",
        "hover:shadow-[0_12px_44px_rgba(0,0,0,0.28)] transition",
        "p-4 sm:p-5 md:p-6",
        className
      )}
    >
      {/* HEADER */}
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm sm:text-base font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="shrink-0 rounded-lg border border-white/10 bg-muted/30 p-1">
            {actions}
          </div>
        )}
      </header>

      {/* CONTENT */}
      <div className="relative">{children}</div>
    </section>
  );
}
