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
  highlighted,
  action,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-6 space-y-5 bg-white/80 backdrop-blur-xl",
        highlighted
          ? "border-indigo-400 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
          : "border-slate-200"
      )}
    >
      <div className="flex items-center gap-2">
        {highlighted && <Crown className="text-indigo-500" size={18} />}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="text-3xl font-bold">{price}</div>

      <ul className="space-y-2 text-sm text-slate-600">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500" />
            {f}
          </li>
        ))}
      </ul>

      {action}
    </div>
  );
}
