"use client";

import { Dispatch, SetStateAction } from "react";

export type TaskFilter = "all" | "open" | "overdue" | "completed";

const TABS: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "open", label: "Açık" },
  { key: "overdue", label: "Gecikmiş" },
  { key: "completed", label: "Tamamlanan" },
];

export function TaskFilterTabs({
  value,
  onChange,
}: {
  value: TaskFilter;
  onChange: Dispatch<SetStateAction<TaskFilter>>;
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 bg-black/80 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
        {TABS.map(tab => {
          const active = value === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={[
                "flex-shrink-0 rounded-full px-5 py-2 text-[12px] font-medium transition",
                active
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-neutral-300",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
