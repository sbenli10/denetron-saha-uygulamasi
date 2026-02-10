//APP\app\admin\settings\_components\PlanCard.tsx
"use client";

import { Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  action?: React.ReactNode;
}

export default function PlanCard({
  title,
  price,
  features,
  highlighted = false,
  action,
}: Props) {
  return (
    <div
      className={cn(
        "relative rounded-3xl border p-6 space-y-6",
        "bg-background/80 backdrop-blur-xl transition-all",
        "hover:shadow-lg",
        highlighted
          ? "border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
          : "border-border"
      )}
    >
      {/* Recommended badge */}
      {highlighted && (
        <div
          className="
            absolute -top-3 left-6
            rounded-full bg-indigo-600 px-3 py-1
            text-[11px] font-semibold text-white
            shadow-md
          "
        >
          Önerilen
        </div>
      )}

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {highlighted && (
            <Crown size={18} className="text-indigo-500" />
          )}
          <h3 className="text-lg font-semibold tracking-tight">
            {title}
          </h3>
        </div>

        <div className="text-3xl font-bold tracking-tight">
          {price}
        </div>

        {title !== "Free" && (
          <p className="text-xs text-muted-foreground">
            KDV hariçtir
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check
              size={16}
              className="mt-0.5 text-emerald-500"
            />
            <span className="text-muted-foreground">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Action */}
      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  );
}
