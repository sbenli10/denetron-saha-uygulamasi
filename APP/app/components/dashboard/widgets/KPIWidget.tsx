// app/components/dashboard/widgets/KPIWidget.tsx
"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KPIWidget({
  title,
  value,
  trend = 0,
  trendUp = true,
}: {
  title: string;
  value: number;
  trend?: number;
  trendUp?: boolean;
}) {
  const TrendIcon = trend === 0 ? Minus : trendUp ? ArrowUpRight : ArrowDownRight;
  const trendColor =
    trend === 0
      ? "text-muted-foreground"
      : trendUp
      ? "text-[var(--accent-color)]"
      : "text-red-500";

  return (
    <div
      className="
        rounded-2xl border border-[rgba(255,255,255,0.08)]
        bg-card/70 backdrop-blur-xl
        p-5 shadow-[0_8px_28px_rgba(0,0,0,0.2)]
        hover:shadow-[0_10px_32px_rgba(0,0,0,0.28)]
        transition
      "
    >
      <div className="text-xs font-medium text-muted-foreground">{title}</div>

      <div className="mt-2 flex items-end justify-between">
        <div>
          <div className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            {new Intl.NumberFormat("tr-TR").format(value)}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <TrendIcon className={cn("h-4 w-4", trendColor)} />
            <span className={cn("text-sm font-semibold", trendColor)}>
              {trend === 0 ? "%0" : `%${trend}`}
            </span>
            <span className="text-xs text-muted-foreground">son 30 gün</span>
          </div>
        </div>

        <div className="rounded-xl bg-muted/60 border border-white/10 px-3 py-1 text-xs text-muted-foreground">
          KPI
        </div>
      </div>
    </div>
  );
}
