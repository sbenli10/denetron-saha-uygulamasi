"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type KPIIntent = "neutral" | "success" | "warning" | "danger";

export default function KPIWidget({
  title,
  value,
  trend = 0,
  intent = "neutral",
  helper,
}: {
  title: string;
  value: number;
  trend?: number;
  intent?: KPIIntent;
  helper?: string;
}) {
  const isUp = trend > 0;
  const isDown = trend < 0;

  const TrendIcon = trend === 0 ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  const intentStyles: Record<KPIIntent, string> = {
    neutral: "text-muted-foreground",
    success: "text-emerald-500",
    warning: "text-amber-500",
    danger: "text-red-500",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/70 backdrop-blur-xl p-5 transition",
        "shadow-[0_8px_28px_rgba(0,0,0,0.22)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.32)]",
        intent === "danger" && "border-red-500/30",
        intent === "warning" && "border-amber-500/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium text-muted-foreground">{title}</div>

        <span
          className={cn(
            "rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            intentStyles[intent],
            "bg-muted/40"
          )}
        >
          KPI
        </span>
      </div>

      <div className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {new Intl.NumberFormat("tr-TR").format(value)}
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <TrendIcon className={cn("h-4 w-4", intentStyles[intent])} />
        <span className={cn("font-semibold", intentStyles[intent])}>
          {trend === 0 ? "%0" : `%${Math.abs(trend)}`}
        </span>
        <span className="text-xs text-muted-foreground">son 30 gün</span>
      </div>

      {helper && (
        <div className="mt-2 text-xs text-muted-foreground">
          {helper}
        </div>
      )}
    </div>
  );
}
