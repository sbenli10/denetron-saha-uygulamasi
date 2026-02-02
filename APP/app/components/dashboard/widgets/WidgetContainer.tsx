// app/components/dashboard/widgets/WidgetContainer.tsx
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
        "w-full rounded-2xl border border-[rgba(255,255,255,0.08)]",
        "bg-card/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.15)]",
        "transition hover:shadow-[0_10px_40px_rgba(0,0,0,0.25)]",
        "p-4 sm:p-5 md:p-6",
        className
      )}
    >
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-sm sm:text-base font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="shrink-0">{actions}</div>
        ) : null}
      </header>

      <div>{children}</div>
    </section>
  );
}
